import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login() {
    // Store the user's email and password as controlled form values.
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Update the corresponding form field whenever the user types.
    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleLogin(e) {
        e.preventDefault(); // Prevent the default form submission and page reload.
        setError("");
        setLoading(true);

        try {
            // Ask Firebase Authentication to verify the email and password.
            await signInWithEmailAndPassword(
                auth, form.email.trim(), form.password
            );

            // Redirect to the home page and replace the current history entry.
            navigate("/", { replace: true });
        } catch (err) {
            console.error(err);
            setError("Invalid email or password. Please try again.");
        } finally {
            setLoading(false); // Reset loading whether login succeeds or fails.
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card login-card">
                <h1>Login</h1>
                <p className="auth-subtitle">Sign in to your DEV@Deakin account</p>

                {/* Show this message when Signup navigates here after registration. */}
                {location.state?.registered && (
                    <p>Account created successfully. Please log in.</p>
                )}

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
                        <label htmlFor="password">Your password</label>
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

                    {/* Display the error only when Firebase login fails. */}
                    {error && <p className="form-error">{error}</p>}

                    <button className="primary-button" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </section>
        </main>
    );
}

export default Login;