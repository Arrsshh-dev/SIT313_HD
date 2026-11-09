import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./App.css";

function Navbar() {
    const { currentUser, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Unable to log out. Please try again.");
        }
    }

    return (
        <header className="site-header">
            <div className="navbar-container">
                <Link to="/" className="nav-logo">
                    DEV@Deakin
                </Link>

                <div className="nav-search-wrapper">
                    <input
                        type="text"
                        placeholder="Search posts, articles, tutorials..."
                        className="nav-search-input"
                    />
                </div>

                <nav className="nav-menu">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/browse-posts" className="nav-link">Browse Posts</Link>
                    <Link to="/Post" className="nav-link">New Post</Link>
                    <Link to="/pricing" className="nav-link">Pricing</Link>

                    {currentUser ? (
                        <>
                            <Link to="/profile" className="nav-link">Profile</Link>

                            {isAdmin && (
                                <Link to="/admin" className="nav-admin-badge">
                                    Admin Panel
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="nav-btn-logout"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="nav-auth-group">
                            <Link to="/login" className="nav-btn-login">Login</Link>
                            <Link to="/signup" className="nav-btn-signup">Sign Up</Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Navbar;
