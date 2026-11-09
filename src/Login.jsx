import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");

    // 2FA Challenge State
    const [require2FA, setRequire2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");
    const [tempUser, setTempUser] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    // Helper to evaluate and trigger 2FA if enabled on the user's account
    async function checkAndEnforce2FA(user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        if (userData.twoFactorEnabled === true) {
            setTempUser(user);
            setRequire2FA(true);

            const token = await user.getIdToken();
            await fetch(`${API}/auth/2fa/send`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            return true;
        }

        return false;
    }

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const result = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
            const user = result.user;

            const is2FA = await checkAndEnforce2FA(user);
            if (!is2FA) {
                navigate("/", { replace: true });
            }
        } catch (err) {
            console.error(err);
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        setError("");
        setSuccessMessage("");
        setGoogleLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const snapshot = await getDoc(userRef);

            if (!snapshot.exists()) {
                await setDoc(userRef, {
                    name: user.displayName || "",
                    email: user.email || "",
                    subscription: "free",
                    createdAt: serverTimestamp()
                });
                navigate("/", { replace: true });
            } else {
                const is2FA = await checkAndEnforce2FA(user);
                if (!is2FA) {
                    navigate("/", { replace: true });
                }
            }
        } catch (err) {
            console.error(err);
            if (err.code !== "auth/popup-closed-by-user") {
                setError("Google sign-in failed. Please try again.");
            }
        } finally {
            setGoogleLoading(false);
        }
    }

    async function handleVerify2FA(e) {
        e.preventDefault();
        setError("");

        if (!twoFACode || twoFACode.trim().length !== 6) {
            setError("Please enter a valid 6-digit code.");
            return;
        }

        setLoading(true);

        try {
            const token = await tempUser.getIdToken();
            const res = await fetch(`${API}/auth/2fa/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ code: twoFACode.trim() })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Invalid verification code.");

            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel2FA() {
        if (tempUser) {
            await signOut(auth);
        }
        setRequire2FA(false);
        setTempUser(null);
        setTwoFACode("");
        setError("");
    }

    // Password Reset Submission Handler
    async function handlePasswordReset(e) {
        e.preventDefault();
        setResetError("");
        setResetSuccess("");

        if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
            setResetError("Please enter a valid email address.");
            return;
        }

        setResetLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail.trim());
            setResetSuccess("Password reset email sent! Check your inbox.");
            setTimeout(() => {
                setShowForgotModal(false);
                setSuccessMessage("Check your email for the password reset link.");
                setResetSuccess("");
                setResetEmail("");
            }, 2500);
        } catch (err) {
            console.error(err);
            if (err.code === "auth/user-not-found") {
                setResetError("No account found with this email address.");
            } else {
                setResetError("Failed to send reset link. Please try again later.");
            }
        } finally {
            setResetLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card login-card">
                <h1>{require2FA ? "Security Verification" : "Login"}</h1>
                <p className="auth-subtitle">
                    {require2FA
                        ? `A 6-digit verification code was sent to ${tempUser?.email}`
                        : "Sign in to your DEV@Deakin account"}
                </p>

                {location.state?.registered && !require2FA && (
                    <p className="auth-registered">Account created successfully. Please log in.</p>
                )}

                {successMessage && !require2FA && (
                    <div className="auth-modal-alert success" style={{ margin: "0 0 16px" }}>
                        {successMessage}
                    </div>
                )}

                {require2FA ? (
                    <form onSubmit={handleVerify2FA}>
                        <div className="form-group">
                            <label htmlFor="twofa-code">Verification Code</label>
                            <input
                                id="twofa-code"
                                type="text"
                                maxLength={6}
                                value={twoFACode}
                                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                                placeholder="123456"
                                required
                                style={{
                                    letterSpacing: "4px",
                                    fontSize: "18px",
                                    textAlign: "center",
                                    fontWeight: "600"
                                }}
                            />
                        </div>

                        {error && <p className="form-error">{error}</p>}

                        <button className="primary-button" disabled={loading || twoFACode.length !== 6}>
                            {loading ? "Verifying..." : "Verify & Complete Login"}
                        </button>

                        <button
                            type="button"
                            className="auth-modal-cancel"
                            style={{ width: "100%", marginTop: "10px", padding: "10px" }}
                            onClick={handleCancel2FA}
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <>
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Your email</label>
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
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label htmlFor="password" style={{ margin: 0 }}>Your password</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResetEmail(form.email);
                                            setResetError("");
                                            setResetSuccess("");
                                            setShowForgotModal(true);
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#3478f6",
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            padding: 0
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            {error && <p className="form-error">{error}</p>}

                            <button className="primary-button" disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <button
                            type="button"
                            className="google-button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                        >
                            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                <path fill="none" d="M0 0h48v48H0z"/>
                            </svg>
                            {googleLoading ? "Signing in..." : "Continue with Google"}
                        </button>

                        <p className="auth-switch">
                            Don't have an account? <Link to="/signup">Sign up</Link>
                        </p>
                    </>
                )}
            </section>

            {/* FIXED FORGOT PASSWORD MODAL */}
            {showForgotModal && (
                <div className="auth-modal-overlay" onClick={() => setShowForgotModal(false)}>
                    <div
                        className="auth-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="forgot-password-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="forgot-password-title">Reset Your Password</h2>
                        <p className="auth-modal-desc">
                            Enter your registered email address and we will send you a link to reset your password.
                        </p>

                        {resetError && <div className="auth-modal-alert error">{resetError}</div>}
                        {resetSuccess && <div className="auth-modal-alert success">{resetSuccess}</div>}

                        <form onSubmit={handlePasswordReset}>
                            <div className="form-group" style={{ marginBottom: "16px" }}>
                                <label htmlFor="reset-email">Your email address</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        boxSizing: "border-box",
                                        border: "1px solid #ccc",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>

                            <div className="auth-modal-actions">
                                <button
                                    type="button"
                                    className="auth-modal-cancel"
                                    onClick={() => setShowForgotModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="auth-modal-submit"
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Login;
