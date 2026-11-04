require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://devdeakin-web.netlify.app"
    ]
}));
app.use(express.json({ limit: "20kb" }));

if (!admin.apps.length) {
    const serviceAccount = require(
        path.join(__dirname, "serviceAccountKey.json")
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase Admin connected successfully!");
}

const firestore = () => admin.firestore();

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.get("/", (req, res) => res.status(200).json({ message: "DEV@Deakin backend is running." }));

// Authentication middleware: all identity and plan decisions are made on the server.
async function authenticate(req, res, next) {
    if (!admin.apps.length) {
        return res.status(503).json({ message: "Firebase Admin is not configured on the server." });
    }
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Please log in to continue." });
    try {
        req.user = await admin.auth().verifyIdToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Your session is invalid or expired. Please log in again." });
    }
}

async function getSubscription(uid) {
    const snap = await firestore().collection("users").doc(uid).get();
    return String(snap.exists ? snap.data().subscription || "free" : "free").toLowerCase() === "paid" ? "paid" : "free";
}

function validatePost(body) {
    if (!body || !["Question", "Article"].includes(body.type)) return "Choose a valid post type.";
    if (typeof body.title !== "string" || body.title.trim().length < 5 || body.title.trim().length > 150) return "Title must contain 5–150 characters.";
    if (!Array.isArray(body.tags) || body.tags.length < 1 || body.tags.length > 3 ||
        body.tags.some(tag => typeof tag !== "string" || tag.trim().length < 2 || tag.trim().length > 30)) {
        return "Add 1–3 tags, each between 2 and 30 characters.";
    }
    if (body.type === "Question") {
        if (typeof body.description !== "string" || body.description.trim().length < 20 || body.description.trim().length > 5000) return "Question description must contain 20–5000 characters.";
    } else {
        if (typeof body.abstract !== "string" || body.abstract.trim().length < 20 || body.abstract.trim().length > 500 || body.abstract.trim().includes("\n")) return "Abstract must be one paragraph of 20–500 characters.";
        if (typeof body.articleText !== "string" || body.articleText.trim().length < 50 || body.articleText.trim().length > 10000) return "Article text must contain 50–10,000 characters.";
    }
    if (!["free", "paid"].includes(String(body.plan || "free").toLowerCase())) return "Choose a valid post plan.";
    return "";
}

app.post("/posts", authenticate, async (req, res) => {
    try {
        const error = validatePost(req.body);
        if (error) return res.status(400).json({ message: error });
        const subscription = await getSubscription(req.user.uid);
        const plan = String(req.body.plan || "free").toLowerCase();
        if (plan === "paid" && subscription !== "paid") {
            return res.status(403).json({ message: "Only Paid subscribers can publish a Paid post. Upgrade your plan first." });
        }
        const post = {
            type: req.body.type,
            title: req.body.title.trim(),
            tags: req.body.tags.map(tag => tag.trim()),
            plan,
            authorId: req.user.uid,
            authorEmail: req.user.email || "",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (post.type === "Question") post.description = req.body.description.trim();
        else {
            post.abstract = req.body.abstract.trim();
            post.articleText = req.body.articleText.trim();
        }
        const ref = await firestore().collection("posts").add(post);
        return res.status(201).json({ message: "Post published successfully.", id: ref.id });
    } catch (error) {
        console.error("Create post failed:", error.message);
        return res.status(500).json({ message: "Unable to save your post. Please try again." });
    }
});

// Anonymous and Free accounts receive only free posts. Paid accounts receive both.
// Filtering is applied after the access-control query, so paid records never reach a Free client.
app.get("/posts", async (req, res) => {
    try {
        if (!admin.apps.length) return res.status(503).json({ message: "Firebase Admin is not configured on the server." });
        let subscription = "free";
        const header = req.headers.authorization || "";
        if (header.startsWith("Bearer ")) {
            try {
                const decoded = await admin.auth().verifyIdToken(header.slice(7));
                subscription = await getSubscription(decoded.uid);
            } catch (_) {
                return res.status(401).json({ message: "Your session is invalid. Please refresh or log in again." });
            }
        }
        const allowedPlans = subscription === "paid" ? ["free", "paid"] : ["free"];
        const snapshot = await firestore().collection("posts")
            .where("plan", "in", allowedPlans)
            .get();
        let posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : null
            };
        });
        // Sorting and filters are safe to apply after the server has enforced plan access.
        const { type, tag, from, to, plan } = req.query;
        if (type && ["Question", "Article"].includes(type)) posts = posts.filter(p => p.type === type);
        if (plan && allowedPlans.includes(String(plan).toLowerCase())) posts = posts.filter(p => p.plan === String(plan).toLowerCase());
        if (tag) posts = posts.filter(p => (p.tags || []).some(t => t.toLowerCase() === String(tag).toLowerCase()));
        if (from) posts = posts.filter(p => p.createdAt && p.createdAt >= new Date(from).toISOString());
        if (to) posts = posts.filter(p => p.createdAt && p.createdAt <= new Date(to + "T23:59:59.999Z").toISOString());
        posts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        return res.json({ posts, subscription });
    } catch (error) {
        console.error("Fetch posts failed:", error.message);
        return res.status(500).json({ message: "Unable to load posts." });
    }
});

// Existing newsletter endpoint.
app.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body || {};
        if (typeof email !== "string" || !email.trim() || email.trim().length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }
        if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
            return res.status(500).json({ message: "The email service is not configured." });
        }
        await sgMail.send({
            to: email.trim(), from: process.env.SENDGRID_FROM_EMAIL,
            subject: "Welcome to DEV@Deakin Daily Insider!",
            text: "Thank you for subscribing to the DEV@Deakin Daily Insider newsletter.",
            html: "<h2>Welcome to DEV@Deakin!</h2><p>Thank you for subscribing to our Daily Insider newsletter.</p>"
        });
        return res.status(202).json({ message: "Subscription successful! Please check your inbox." });
    } catch (error) {
        console.error("Newsletter subscription error:", error.response?.statusCode || error.message);
        return res.status(502).json({ message: "We could not send your subscription email. Please try again later." });
    }
});

app.listen(PORT, () => console.log(`DEV@Deakin backend running on port ${PORT}`));
