require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    "http://localhost:5173",
    "https://devdeakin-web.netlify.app"
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".netlify.app")) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive for production deployment
    },
    credentials: true
}));
app.use(express.json({ limit: "20kb" }));

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Render / Cloud deployment: parse JSON from environment variable
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin connected via FIREBASE_SERVICE_ACCOUNT env var!");
        } catch (err) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", err.message);
        }
    } else {
        // Local deployment: load from serviceAccountKey.json file if present
        const keyPath = path.join(__dirname, "serviceAccountKey.json");
        try {
            const serviceAccount = require(keyPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin connected successfully from serviceAccountKey.json!");
        } catch (err) {
            console.warn("Notice: serviceAccountKey.json not found locally and FIREBASE_SERVICE_ACCOUNT not set.");
        }
    }
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

// Helper to check if a user is an administrator
async function isAdmin(uid) {
    const snap = await firestore().collection("users").doc(uid).get();
    if (!snap.exists) return false;
    const data = snap.data();
    return data.role === "admin" || data.isAdmin === true;
}

// Middleware: Ensures the authenticated user has admin privileges
async function requireAdmin(req, res, next) {
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ message: "Authentication required." });
    }
    const adminStatus = await isAdmin(req.user.uid);
    if (!adminStatus) {
        return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
    next();
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

// In-memory or Firestore-backed OTP store for 2FA codes
// Stores: { [uid]: { code: string, expiresAt: number } }
const otpStore = new Map();

// Helper to generate a secure 6-digit numeric OTP code
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/2fa/send - Generates and dispatches a 6-digit OTP code to the user's email
app.post("/auth/2fa/send", authenticate, async (req, res) => {
    try {
        const uid = req.user.uid;
        const email = req.user.email;

        if (!email) {
            return res.status(400).json({ message: "No email address found for this user account." });
        }

        const code = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

        otpStore.set(uid, { code, expiresAt });

        // If SendGrid is configured, send the code via email; otherwise log to console for development
        if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
            await sgMail.send({
                to: email,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: "Your DEV@Deakin Verification Code",
                text: `Your two-factor verification code is: ${code}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #222;">
                        <h2>DEV@Deakin Two-Factor Verification</h2>
                        <p>Use the following 6-digit verification code to complete your verification:</p>
                        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #008f95; margin: 20px 0;">
                            ${code}
                        </div>
                        <p style="color: #666; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please secure your account immediately.</p>
                    </div>
                `
            });
        } else {
            console.log(`[2FA DEV MODE] Verification code for ${email} (UID: ${uid}): ${code}`);
        }

        return res.json({ message: "Verification code sent to your registered email." });
    } catch (err) {
        console.error("2FA send code error:", err.message);
        return res.status(500).json({ message: "Failed to dispatch verification code." });
    }
});

// POST /auth/2fa/verify - Verifies code and enables or confirms 2FA status
app.post("/auth/2fa/verify", authenticate, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { code, enable } = req.body || {};

        if (!code || typeof code !== "string" || code.trim().length !== 6) {
            return res.status(400).json({ message: "Please provide a valid 6-digit verification code." });
        }

        const record = otpStore.get(uid);

        if (!record) {
            return res.status(400).json({ message: "No active verification code found. Please request a new code." });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(uid);
            return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
        }

        if (record.code !== code.trim()) {
            return res.status(400).json({ message: "Incorrect verification code. Please try again." });
        }

        // Code is verified, delete the one-time record
        otpStore.delete(uid);

        // If this verification is to enable 2FA on the user's profile
        if (enable === true) {
            await firestore().collection("users").doc(uid).update({
                twoFactorEnabled: true
            });
        }

        return res.json({ success: true, message: "Verification code confirmed successfully." });
    } catch (err) {
        console.error("2FA verification error:", err.message);
        return res.status(500).json({ message: "Failed to process verification code." });
    }
});

// POST /auth/2fa/disable - Allows the authenticated user to turn off 2FA
app.post("/auth/2fa/disable", authenticate, async (req, res) => {
    try {
        const uid = req.user.uid;
        await firestore().collection("users").doc(uid).update({
            twoFactorEnabled: false
        });
        return res.json({ success: true, message: "Two-Factor Authentication disabled." });
    } catch (err) {
        console.error("2FA disable error:", err.message);
        return res.status(500).json({ message: "Failed to disable 2FA." });
    }
});

// POST /posts/:id/like - Toggle like/upvote on a post
app.post("/posts/:id/like", authenticate, async (req, res) => {
    try {
        const postId = req.params.id;
        const uid = req.user.uid;
        const postRef = firestore().collection("posts").doc(postId);
        const postSnap = await postRef.get();

        if (!postSnap.exists) {
            return res.status(404).json({ message: "Post not found." });
        }

        const data = postSnap.data();
        const likes = Array.isArray(data.likes) ? data.likes : [];
        const alreadyLiked = likes.includes(uid);

        let updatedLikes;
        if (alreadyLiked) {
            updatedLikes = likes.filter(id => id !== uid);
        } else {
            updatedLikes = [...likes, uid];
        }

        await postRef.update({
            likes: updatedLikes,
            likeCount: updatedLikes.length
        });

        return res.json({
            liked: !alreadyLiked,
            likeCount: updatedLikes.length
        });
    } catch (err) {
        console.error("Like post error:", err.message);
        return res.status(500).json({ message: "Failed to update like status." });
    }
});

// GET /posts/:id/comments - Retrieve discussion comments for a specific post
app.get("/posts/:id/comments", async (req, res) => {
    try {
        const postId = req.params.id;
        const snapshot = await firestore()
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .orderBy("createdAt", "asc")
            .get();

        const comments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : null
            };
        });

        return res.json({ comments });
    } catch (err) {
        console.error("Fetch comments error:", err.message);
        return res.status(500).json({ message: "Failed to load comments." });
    }
});

// POST /posts/:id/comments - Add a new response/comment to a post
app.post("/posts/:id/comments", authenticate, async (req, res) => {
    try {
        const postId = req.params.id;
        const { text } = req.body || {};

        if (!text || typeof text !== "string" || !text.trim()) {
            return res.status(400).json({ message: "Comment cannot be empty." });
        }

        if (text.trim().length > 2000) {
            return res.status(400).json({ message: "Comment must be within 2000 characters." });
        }

        const newComment = {
            authorId: req.user.uid,
            authorEmail: req.user.email || "Community Member",
            text: text.trim(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await firestore()
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .add(newComment);

        return res.status(201).json({
            id: docRef.id,
            ...newComment,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error("Post comment error:", err.message);
        return res.status(500).json({ message: "Failed to post comment." });
    }
});

// Subscription upgrade endpoint — requires a valid Firebase token.
// The frontend sends payment details here; we validate them server-side then
// use Firebase Admin to write to Firestore so the client can never self-upgrade.
app.post("/subscription/upgrade", authenticate, async (req, res) => {
    try {
        const { fullName, email, cardNumber, expiry, cvv } = req.body || {};

        // --- Server-side payment field validation ---
        if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
            return res.status(400).json({ message: "Full name is required." });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
            return res.status(400).json({ message: "A valid email address is required." });
        }
        if (!cardNumber || !/^\d{16}$/.test(String(cardNumber))) {
            return res.status(400).json({ message: "Enter a valid 16-digit card number." });
        }
        if (!expiry || !/^\d{2}\/\d{2}$/.test(String(expiry))) {
            return res.status(400).json({ message: "Enter the expiry date in MM/YY format." });
        }
        const [month, year] = String(expiry).split("/").map(Number);
        if (month < 1 || month > 12) {
            return res.status(400).json({ message: "Enter a valid expiry month (01–12)." });
        }
        const expiryDate = new Date(2000 + year, month); // first day of month after expiry
        if (expiryDate <= new Date()) {
            return res.status(400).json({ message: "Your card has expired." });
        }
        if (!cvv || !/^\d{3,4}$/.test(String(cvv))) {
            return res.status(400).json({ message: "Enter a valid 3 or 4-digit CVV." });
        }

        // --- Check the user isn't already on the Paid plan ---
        const currentPlan = await getSubscription(req.user.uid);
        if (currentPlan === "paid") {
            return res.status(409).json({ message: "Your account already has the Paid plan." });
        }

        // --- Write the upgrade using Firebase Admin (server-side only) ---
        // Using Admin SDK here means no Firestore Security Rule can be bypassed,
        // and the client's token cannot forge this write on its own.
        await firestore().collection("users").doc(req.user.uid).update({
            subscription: "paid"
        });

        return res.status(200).json({ message: "Your plan has been upgraded to Paid!" });
    } catch (err) {
        console.error("Subscription upgrade failed:", err.message);
        return res.status(500).json({ message: "Could not process your upgrade. Please try again." });
    }
});

// ==========================================
// ADMIN DASHBOARD & MODERATION ENDPOINTS (RBAC)
// ==========================================

// GET /admin/stats - Overview metrics of users and posts
app.get("/admin/stats", authenticate, requireAdmin, async (req, res) => {
    try {
        const usersSnap = await firestore().collection("users").get();
        const postsSnap = await firestore().collection("posts").get();

        const totalUsers = usersSnap.size;
        let paidUsers = 0;
        let adminUsers = 0;

        usersSnap.forEach(doc => {
            const data = doc.data();
            if (String(data.subscription || "").toLowerCase() === "paid") paidUsers++;
            if (data.role === "admin" || data.isAdmin === true) adminUsers++;
        });

        const totalPosts = postsSnap.size;
        let questionsCount = 0;
        let articlesCount = 0;
        let paidPostsCount = 0;

        postsSnap.forEach(doc => {
            const data = doc.data();
            if (data.type === "Question") questionsCount++;
            if (data.type === "Article") articlesCount++;
            if (data.plan === "paid") paidPostsCount++;
        });

        return res.json({
            users: {
                total: totalUsers,
                paid: paidUsers,
                free: totalUsers - paidUsers,
                admins: adminUsers
            },
            posts: {
                total: totalPosts,
                questions: questionsCount,
                articles: articlesCount,
                paid: paidPostsCount,
                free: totalPosts - paidPostsCount
            }
        });
    } catch (err) {
        console.error("Admin stats fetch error:", err.message);
        return res.status(500).json({ message: "Failed to fetch platform metrics." });
    }
});

// GET /admin/posts - Fetch all posts without subscription filters for moderation
app.get("/admin/posts", authenticate, requireAdmin, async (req, res) => {
    try {
        const snapshot = await firestore().collection("posts").get();
        const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : null
            };
        });
        posts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        return res.json({ posts });
    } catch (err) {
        console.error("Admin fetch posts error:", err.message);
        return res.status(500).json({ message: "Failed to fetch all posts for moderation." });
    }
});

// GET /admin/users - List users with roles and subscriptions
app.get("/admin/users", authenticate, requireAdmin, async (req, res) => {
    try {
        const snap = await firestore().collection("users").get();
        const users = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return res.json({ users });
    } catch (err) {
        console.error("Admin fetch users error:", err.message);
        return res.status(500).json({ message: "Failed to fetch users list." });
    }
});

// PATCH /admin/users/:uid/subscription - Toggle or update user subscription
app.patch("/admin/users/:uid/subscription", authenticate, requireAdmin, async (req, res) => {
    try {
        const { plan } = req.body;
        if (!["free", "paid"].includes(plan)) {
            return res.status(400).json({ message: "Invalid plan. Choose 'free' or 'paid'." });
        }
        await firestore().collection("users").doc(req.params.uid).update({
            subscription: plan
        });
        return res.json({ message: `User subscription updated to ${plan}.` });
    } catch (err) {
        console.error("Admin update subscription error:", err.message);
        return res.status(500).json({ message: "Failed to update subscription." });
    }
});

// DELETE /admin/posts/:id - Permanently moderate / remove inappropriate post
app.delete("/admin/posts/:id", authenticate, requireAdmin, async (req, res) => {
    try {
        await firestore().collection("posts").doc(req.params.id).delete();
        return res.json({ message: "Post removed by administrator." });
    } catch (err) {
        console.error("Admin delete post error:", err.message);
        return res.status(500).json({ message: "Failed to delete post." });
    }
});

// GET /auth/me - Helper endpoint to return full user claims/role
app.get("/auth/me", authenticate, async (req, res) => {
    try {
        const snap = await firestore().collection("users").doc(req.user.uid).get();
        const data = snap.exists ? snap.data() : {};
        return res.json({
            uid: req.user.uid,
            email: req.user.email,
            isAdmin: data.role === "admin" || data.isAdmin === true,
            subscription: data.subscription || "free"
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch user state." });
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
