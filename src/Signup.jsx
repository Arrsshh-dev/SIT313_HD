import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signOut, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

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
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    // Update only the input field that the user changes.
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSignup(e) {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await createUserWithEmailAndPassword(
                auth, form.email.trim(), form.password
            );

            await updateProfile(result.user, {
                displayName: form.name.trim()
            });

            await setDoc(doc(db, "users", result.user.uid), {
                name: form.name.trim(),
                email: form.email.trim(),
                subscription: "free",
                createdAt: serverTimestamp()
            });

            await signOut(auth);
            navigate("/login", { state: { registered: true } });
        } catch (err) {
            console.error(err);
            setError(
                err.code === "auth/email-already-in-use"
                    ? "This email is already registered. Please go to the Login page."
                    : "Signup failed. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignUp() {
        setError("");
        setGoogleLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if this user already exists by UID
            const userRef = doc(db, "users", user.uid);
            const snapshot = await getDoc(userRef);

            // Also check if an account with this email already exists under a different UID
            let emailAlreadyRegistered = snapshot.exists();

            if (!emailAlreadyRegistered && user.email) {
                const q = query(collection(db, "users"), where("email", "==", user.email.trim()));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                    emailAlreadyRegistered = true;
                }
            }

            if (emailAlreadyRegistered) {
                // Sign out the user immediately so they don't bypass registration/login
                await signOut(auth);
                setError("An account with this email is already registered. Please go to the Login page to sign in.");
                return;
            }

            // Fresh new Google user registration
            await setDoc(userRef, {
                name: user.displayName || "",
                email: user.email || "",
                subscription: "free",
                createdAt: serverTimestamp()
            });

            // Sign out the new user and redirect to login with confirmation
            await signOut(auth);
            navigate("/login", { state: { registered: true } });
        } catch (err) {
            console.error(err);
            if (err.code !== "auth/popup-closed-by-user") {
                setError("Google sign-up failed. Please try again.");
            }
        } finally {
            setGoogleLoading(false);
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
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handleChange}
                            required
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

                    {error && <p className="form-error">{error}</p>}

                    <button className="primary-button" disabled={loading}>
                        {loading ? "Creating account..." : "Create"}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <button
                    type="button"
                    className="google-button"
                    onClick={handleGoogleSignUp}
                    disabled={googleLoading}
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    {googleLoading ? "Signing up..." : "Continue with Google"}
                </button>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </section>
        </main>
    );
}

export default Signup;
