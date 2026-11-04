import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

function Signup() {
    // Store all form values together in one state object.
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Update only the input field that the user changes.
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSignup(e) {
        e.preventDefault(); // Stop the browser from reloading the page.
        setError("");

        // Check that both password fields match before creating the account.
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            // Create a new user in Firebase Authentication.
            const result = await createUserWithEmailAndPassword(
                auth, form.email.trim(), form.password
            );

            // Save the user's name to their Firebase Authentication profile.
            await updateProfile(result.user, {
                displayName: form.name.trim()
            });

            // Save additional user details in Firestore using their unique UID.
            
            await setDoc(doc(db, "users", result.user.uid), {
                name: form.name.trim(),
                email: form.email.trim(),
                subscription: "free",
                createdAt: serverTimestamp()
            });

            // Sign out the newly registered user and redirect them to login.
            await signOut(auth);
            navigate("/login", { state: { registered: true } });
        } catch (err) {
            console.error(err);

            // Display a specific message for an email that is already registered.
            setError(
                err.code === "auth/email-already-in-use"
                    ? "This email is already registered."
                    : "Signup failed. Please check your details and try again."
            );
        } finally {
            setLoading(false); // Stop the loading state whether signup succeeds or fails.
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card signup-card">
                <h1>Create a DEV@Deakin Account</h1>
                <p className="auth-subtitle">Create your account to get started</p>

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange} //we use onChange to update the form state whenever the user types in the input field

                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            // The checkbox switches between visible text and a hidden password.
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handleChange}
                            required //we use required to ensure the user cannot submit the form without filling in this field
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label className="show-password">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show password
                    </label>

                    {/* Render the error message only when an error exists. */}
                    {error && <p className="form-error">{error}</p>}

                    <button className="primary-button" disabled={loading}>
                        {loading ? "Creating account..." : "Create"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </section>
        </main>
    );
}

export default Signup;


