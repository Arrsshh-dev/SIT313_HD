
import { useState } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import "./Pricing.css";

function Pricing() {
    const { currentUser, subscription, loading: authLoading } = useAuth();

    const [showModal, setShowModal] = useState(false);
    const isPaid = String(subscription || "free").toLowerCase() === "paid";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: currentUser?.email || "",
        cardNumber: "",
        expiry: "",
        cvv: "",
    });

    function handleChange(e) {
        const { name, value } = e.target;

        // Allow digits only in the card number and CVV
        if (name === "cardNumber") {
            setFormData({
                ...formData,
                cardNumber: value.replace(/\D/g, "").slice(0, 16),
            });
            return;
        }

        if (name === "cvv") {
            setFormData({
                ...formData,
                cvv: value.replace(/\D/g, "").slice(0, 4),
            });
            return;
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    }

    async function handleUpgrade(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!currentUser) {
            setError("Please log in before upgrading your plan.");
            return;
        }

        if (isPaid) {
            setError("Your account already has the Paid plan.");
            return;
        }

        if (
            !formData.fullName.trim() ||
            !formData.email.trim() ||
            !formData.expiry.trim() ||
            !formData.cardNumber ||
            !formData.cvv
        ) {
            setError("Please complete all payment fields.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (formData.cardNumber.length !== 16) {
            setError("Enter a 16-digit card number.");
            return;
        }

        if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
            setError("Enter the expiry date in MM/YY format.");
            return;
        }

        const [month, year] = formData.expiry.split("/").map(Number);

        if (month < 1 || month > 12) {
            setError("Enter a valid expiry month.");
            return;
        }

        const expiryDate = new Date(2000 + year, month);
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        if (expiryDate <= currentMonth) {
            setError("Your card has expired.");
            return;
        }

        if (!/^\d{3,4}$/.test(formData.cvv)) {
            setError("Enter a valid 3 or 4-digit CVV.");
            return;
        }

        setLoading(true);

        try {
            // Update the subscription in the signed-in user's document
            const userRef = doc(db, "users", currentUser.uid);

            await updateDoc(userRef, {
                subscription: "paid",
            });

            setShowModal(false);
            setSuccess("Your plan has been upgraded to Paid!");
        } catch (err) {
            console.error("Upgrade error:", err);
            setError(
                "Could not upgrade your plan. Please check your Firestore rules and try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (

        <div className="pricing-page">
            {authLoading && <p>Loading your account...</p>}
            <div className="pricing-heading">
                <h1>Choose Your Plan</h1>
                <p>Choose the plan that works best for you.</p>
            </div>

            {success && <p className="pricing-success">{success}</p>}

            {!currentUser && (
                <p className="pricing-notice">
                    Please <Link to="/login">log in</Link> to manage your subscription.
                </p>
            )}

            <div className="pricing-plans">
                <div className="pricing-card">
                    <h2>Free</h2>
                    <p className="pricing-price">$0</p>
                    <p>Free forever</p>

                    <ul>
                        <li>Create posts</li>
                        <li>Browse community content</li>
                        <li>Basic account features</li>
                    </ul>

                    <button
                        className="pricing-button secondary"
                        disabled={!currentUser || !isPaid}
                    >
                        {isPaid ? "Free Plan" : "Current Plan"}
                    </button>
                </div>

                <div className="pricing-card featured">
                    <h2>Paid</h2>
                    <p className="pricing-price">$9.99</p>
                    <p>Per month (demo price)</p>

                    <ul>
                        <li>Everything in Free</li>
                        <li>Access to premium features</li>
                        <li>Enhanced account benefits</li>
                    </ul>

                   {authLoading ? (
  <button className="pricing-button" disabled>
    Loading...
  </button>
) : !currentUser ? (
  <Link to="/login" className="pricing-button">
    Log in to Upgrade
  </Link>
) : isPaid ? (
  <button className="pricing-button" disabled>
    Current Plan
  </button>
) : (
  <button
    className="pricing-button"
    onClick={() => {
      setError("");
      setShowModal(true);
    }}
  >
    Upgrade Plan
  </button>
)}
                </div>
            </div>

            {showModal && (
                <div
                    className="upgrade-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="upgrade-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="upgrade-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="upgrade-close"
                            aria-label="Close"
                            onClick={() => setShowModal(false)}
                        >
                            ×
                        </button>

                        <h2 id="upgrade-title">Upgrade to Paid</h2>
                        <p>Demo subscription: $9.99 per month</p>
                        <p className="demo-notice">
                            Demo only. No real payment will be taken.
                        </p>

                        <form onSubmit={handleUpgrade}>
                            <label htmlFor="fullName">Full name</label>
                            <input
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                autoComplete="name"
                                required
                            />

                            <label htmlFor="email">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />

                            <label htmlFor="cardNumber">Card number (demo)</label>
                            <input
                                id="cardNumber"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                inputMode="numeric"
                                placeholder="16 digits"
                                autoComplete="off"
                                maxLength={16}
                                required
                            />

                            <div className="payment-row">
                                <div>
                                    <label htmlFor="expiry">Expiry (MM/YY)</label>
                                    <input
                                        id="expiry"
                                        name="expiry"
                                        value={formData.expiry}
                                        onChange={handleChange}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        autoComplete="off"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="cvv">CVV (demo)</label>
                                    <input
                                        id="cvv"
                                        name="cvv"
                                        type="password"
                                        value={formData.cvv}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        maxLength={4}
                                        autoComplete="off"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <p className="pricing-error">{error}</p>}

                            <button
                                className="pricing-button submit-upgrade"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Confirm Upgrade"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pricing;
