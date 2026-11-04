import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Profile.css";

function Profile() {
  const {
    currentUser,
    userProfile,
    subscription,
    loading,
    logout,
  } = useAuth();

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
  const displayName =
    userProfile?.name || currentUser.displayName || "User";
  const displayEmail = userProfile?.email || currentUser.email;

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        <p className="profile-subtitle">
          View and manage your account details.
        </p>

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

            <span
              className={`subscription-status ${
                isPaid ? "paid-status" : "free-status"
              }`}
            >
              {isPaid ? "Paid" : "Free"}
            </span>
          </div>

          {!isPaid && (
            <div className="upgrade-section">
              <p>
                Want access to the additional features available in the
                Paid plan?
              </p>

              <Link to="/pricing" className="profile-button">
                Upgrade Plan
              </Link>
            </div>
          )}
        </section>

        <div className="profile-actions">
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;