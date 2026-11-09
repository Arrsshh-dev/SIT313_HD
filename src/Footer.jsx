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
                headers: { "Content-Type": "application/json" },
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
            {/* Newsletter Subscription Strip */}
            <div className="newsletter-banner">
                <div className="newsletter-container">
                    <div className="newsletter-text">
                        <h3>Stay Connected</h3>
                        <p>Sign up for our daily insider newsletter to receive updates on questions, articles, and workshops.</p>
                    </div>

                    <form onSubmit={handleSubscribe} className="newsletter-form">
                        <input
                            type="email"
                            id="newsletter-email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
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
                        className={success ? "newsletter-status success" : "newsletter-status error"}
                    >
                        {message}
                    </p>
                )}
            </div>

            {/* Footer Main Links */}
            <div className="footer-content-wrapper">
                <div className="footer-columns-grid">
                    <div className="footer-column">
                        <h4>Explore</h4>
                        <a href="/">Home</a>
                        <a href="/browse-posts">Questions & Discussions</a>
                        <a href="#articles">Featured Articles</a>
                        <a href="#tutorials">Coding Tutorials</a>
                    </div>

                    <div className="footer-column">
                        <h4>Support & Resources</h4>
                        <a href="#faqs">Frequently Asked Questions</a>
                        <a href="#help">Documentation & Help Center</a>
                        <a href="#contact">Contact Teaching Team</a>
                    </div>

                    <div className="footer-column">
                        <h4>Connect</h4>
                        <p className="footer-brand-desc">
                            A collaborative platform for SIT313 developers and students at Deakin University.
                        </p>
                        <div className="footer-social-links">
                            <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">
                                <FaFacebookF />
                            </a>
                            <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noreferrer">
                                <FaTwitter />
                            </a>
                            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer">
                                <FaInstagram />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom-bar">
                    <p>© {new Date().getFullYear()} DEV@Deakin Community. All rights reserved.</p>
                    <div className="footer-legal-links">
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#conduct">Code of Conduct</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
