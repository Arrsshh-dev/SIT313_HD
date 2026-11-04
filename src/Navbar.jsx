import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./App.css";

function Navbar() {
    const { currentUser, logout } = useAuth();
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
        <nav className="navbar">
            <Link to="/" className="nav-logo">
                DEV@Deakin
            </Link>

            <input
                type="text"
                placeholder="Search"
                className="nav-search"
            />

            <div className="nav-links">
                <Link to="/Post">Post</Link>
                <Link to="/browse-posts">Browse Posts</Link>

                <Link to="/">Home</Link>

                <Link to="/pricing">Pricing</Link>

                {currentUser ? (
                    <>
                        <Link to="/profile">Profile</Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="nav-logout"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>

                        <Link to="/signup">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
