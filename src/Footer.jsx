
import { useState } from "react";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import "./App.css";

function Footer() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();

        setMessage("");
        setLoading(true);
        setSuccess(false);

        try {
            const API_URL = (
                import.meta.env.VITE_API_URL || "http://localhost:3000"
            ).replace(/\/+$/, "");

            const response = await fetch(`${API_URL}/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: email.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Subscription failed.");
            }

            setSuccess(true);
            setMessage(data.message || "Subscription successful!");
            setEmail("");
        } catch (error) {
            setSuccess(false);
            setMessage(
                error.message === "Failed to fetch"
                    ? "Unable to connect to the server. Please try again."
                    : error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer id="contact" className="site-footer">
            {/* Newsletter */}
            <div className="newsletter">
                <form
                    onSubmit={handleSubscribe}
                    className="newsletter-form"
                >
                    <label htmlFor="newsletter-email">
                        SIGN UP FOR OUR DAILY INSIDER
                    </label>

                    <input
                        type="email"
                        id="newsletter-email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Subscribing..." : "Subscribe"}
                    </button>
                </form>
            </div>

            {message && (
                <p
                    role="status"
                    aria-live="polite"
                    className={success ? "success-message" : "error-message"}
                >
                    {message}
                </p>
            )}

            {/* Footer links */}
            <div className="footer-main">
                <div className="footer-column">
                    <h3>Explore</h3>
                    <a href="/">Home</a>
                    <a href="#questions">Questions</a>
                    <a href="#articles">Articles</a>
                    <a href="#tutorials">Tutorials</a>
                </div>

                <div className="footer-column">
                    <h3>Support</h3>
                    <a href="#faqs">FAQs</a>
                    <a href="#help">Help</a>
                    <a href="#contact">Contact Us</a>
                </div>

                <div className="footer-column">
                    <h3>Stay Connected</h3>
                    <div className="social-icons">
                        <a
                            href="https://www.facebook.com/"
                            aria-label="Facebook"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FaFacebookF />
                        </a>

                        <a
                            href="https://twitter.com/"
                            aria-label="Twitter"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FaTwitter />
                        </a>

                        <a
                            href="https://www.instagram.com/"
                            aria-label="Instagram"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FaInstagram />
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer bottom */}
            <div className="footer-bottom">
                <p>DEV@Deakin 2022</p>

                <div className="footer-legal">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms</a>
                    <a href="#conduct">Code of Conduct</a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
