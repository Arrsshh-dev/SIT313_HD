import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Profile.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Profile() {
  const {
    currentUser,
    userProfile,
    subscription,
    twoFactorEnabled,
    loading,
    logout,
  } = useAuth();

  // 2FA Management State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState("");
  const [twoFAError, setTwoFAError] = useState("");

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <h1>My Profile</h1>
          <p>You need to log in to view your profile.</p>
          <Link to="/login" className="profile-button">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = subscription === "paid";
  const displayName = userProfile?.name || currentUser.displayName || "User";
  const displayEmail = userProfile?.email || currentUser.email;

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Send a 6-digit OTP to the user's email via backend
  async function handleRequest2FACode() {
    setTwoFAError("");
    setTwoFAMessage("");
    setTwoFALoading(true);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/auth/2fa/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code.");

      setTwoFAMessage("A 6-digit verification code has been dispatched to your email.");
      setShow2FAModal(true);
    } catch (err) {
      setTwoFAError(err.message || "Unable to send verification code.");
    } finally {
      setTwoFALoading(false);
    }
  }

  // Submit and verify code to enable 2FA
  async function handleVerifyAndEnable2FA(e) {
    e.preventDefault();
    setTwoFAError("");
    setTwoFAMessage("");

    if (!verificationCode || verificationCode.trim().length !== 6) {
      setTwoFAError("Please enter a valid 6-digit code.");
      return;
    }

    setTwoFALoading(true);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode.trim(), enable: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed.");

      setTwoFAMessage("Two-Factor Authentication is now enabled for your account.");
      setShow2FAModal(false);
      setVerificationCode("");
    } catch (err) {
      setTwoFAError(err.message || "Verification code invalid.");
    } finally {
      setTwoFALoading(false);
    }
  }

  // Disable 2FA
  async function handleDisable2FA() {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication?")) return;

    setTwoFALoading(true);
    setTwoFAError("");

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API}/auth/2fa/disable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to disable 2FA.");

      setTwoFAMessage("Two-Factor Authentication has been disabled.");
    } catch (err) {
      setTwoFAError(err.message || "Unable to disable 2FA.");
    } finally {
      setTwoFALoading(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        <p className="profile-subtitle">View and manage your account details.</p>

        {twoFAMessage && <div className="profile-feedback-success">{twoFAMessage}</div>}
        {twoFAError && <div className="profile-feedback-error">{twoFAError}</div>}

        <section className="profile-section">
          <h2>Account Information</h2>

          <div className="profile-detail">
            <span>Name</span>
            <p>{displayName}</p>
          </div>

          <div className="profile-detail">
            <span>Email</span>
            <p>{displayEmail}</p>
          </div>
        </section>

        {/* SECURITY & 2FA SECTION */}
        <section className="profile-section">
          <h2>Account Security (2FA)</h2>
          <div className="security-card">
            <div>
              <h3>Two-Factor Authentication</h3>
              <p>
                {twoFactorEnabled
                  ? "Two-Factor Authentication is active, requiring a one-time verification code on sign-in."
                  : "Protect your account with an additional layer of security by requiring a verification code sent to your email."}
              </p>
            </div>
            <span className={`security-status ${twoFactorEnabled ? "active" : "inactive"}`}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="security-actions" style={{ marginTop: "16px" }}>
            {twoFactorEnabled ? (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDisable2FA}
                disabled={twoFALoading}
              >
                Disable 2FA
              </button>
            ) : (
              <button
                type="button"
                className="profile-button"
                onClick={handleRequest2FACode}
                disabled={twoFALoading}
              >
                {twoFALoading ? "Sending code..." : "Enable Two-Factor Authentication"}
              </button>
            )}
          </div>
        </section>

        <section className="profile-section">
          <h2>My Subscription</h2>

          <div className="subscription-card">
            <div className="subscription-info">
              <h3>{isPaid ? "Paid Plan" : "Free Plan"}</h3>
              <p>
                {isPaid
                  ? "You are currently subscribed to the Paid plan."
                  : "You are currently using the Free plan."}
              </p>
            </div>

            <span className={`subscription-status ${isPaid ? "paid-status" : "free-status"}`}>
              {isPaid ? "Paid" : "Free"}
            </span>
          </div>

          {!isPaid && (
            <div className="upgrade-section">
              <p>Want access to the additional features available in the Paid plan?</p>
              <Link to="/pricing" className="profile-button">
                Upgrade Plan
              </Link>
            </div>
          )}
        </section>

        <div className="profile-actions">
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {/* 2FA SETUP MODAL */}
      {show2FAModal && (
        <div className="twofa-modal-overlay" onClick={() => setShow2FAModal(false)}>
          <div
            className="twofa-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="twofa-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="twofa-title">Enter Verification Code</h2>
            <p>
              We sent a 6-digit verification code to <strong>{displayEmail}</strong>.
            </p>

            {twoFAError && <div className="profile-feedback-error">{twoFAError}</div>}

            <form onSubmit={handleVerifyAndEnable2FA}>
              <div className="form-group" style={{ margin: "16px 0" }}>
                <label htmlFor="twofa-code">6-Digit Code</label>
                <input
                  id="twofa-code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  style={{
                    letterSpacing: "4px",
                    fontSize: "18px",
                    textAlign: "center",
                    fontWeight: "600",
                    width: "100%",
                    padding: "10px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShow2FAModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-button"
                  disabled={twoFALoading || verificationCode.length !== 6}
                >
                  {twoFALoading ? "Verifying..." : "Confirm & Enable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
