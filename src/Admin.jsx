import { useEffect, useState, useOptimistic, useTransition, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Admin() {
    const { currentUser, isAdmin, loading: authLoading } = useAuth();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    // State for viewing full post details in a modal
    const [selectedPost, setSelectedPost] = useState(null);

    const [, startTransition] = useTransition();

    // Optimistic state for post moderation
    const [optimisticPosts, setOptimisticPosts] = useOptimistic(
        posts,
        (currentPosts, deletedPostId) => currentPosts.filter(p => p.id !== deletedPostId)
    );

    // Optimistic state for user tier adjustments
    const [optimisticUsers, setOptimisticUsers] = useOptimistic(
        users,
        (currentUsers, { uid, newPlan }) =>
            currentUsers.map(u => (u.id === uid ? { ...u, subscription: newPlan } : u))
    );

    const fetchAdminData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        setError("");
        try {
            const token = await currentUser.getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Request statistics, user list, and all posts via admin endpoint
            const [statsRes, usersRes, postsRes] = await Promise.all([
                fetch(`${API}/admin/stats`, { headers }),
                fetch(`${API}/admin/users`, { headers }),
                fetch(`${API}/admin/posts`, { headers })
            ]);

            if (!statsRes.ok || !usersRes.ok || !postsRes.ok) {
                throw new Error("Unable to retrieve administration records. Verify permissions.");
            }

            const statsData = await statsRes.json();
            const usersData = await usersRes.json();
            const postsData = await postsRes.json();

            setStats(statsData);
            setUsers(usersData.users || []);
            setPosts(postsData.posts || []);
        } catch (err) {
            setError(err.message || "An unexpected error occurred while loading administration data.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!authLoading) {
            if (currentUser && isAdmin) {
                fetchAdminData();
            }
        }
    }, [authLoading, currentUser, isAdmin, fetchAdminData]);

    async function handleDeletePost(postId) {
        if (!window.confirm("Confirm deletion of this community post? This action cannot be reversed.")) return;

        startTransition(async () => {
            setOptimisticPosts(postId);

            // Close modal if deleted post was open
            if (selectedPost?.id === postId) {
                setSelectedPost(null);
            }

            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${API}/admin/posts/${postId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error("Server rejected deletion request.");
                }

                setPosts(prev => prev.filter(p => p.id !== postId));
            } catch (err) {
                alert(`Error deleting post: ${err.message}. Changes reverted.`);
                fetchAdminData();
            }
        });
    }

    async function handleTogglePlan(uid, currentPlan) {
        const newPlan = currentPlan === "paid" ? "free" : "paid";

        startTransition(async () => {
            setOptimisticUsers({ uid, newPlan });

            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${API}/admin/users/${uid}/subscription`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ plan: newPlan })
                });

                if (!res.ok) {
                    throw new Error("Server rejected subscription update.");
                }

                setUsers(prev => prev.map(u => (u.id === uid ? { ...u, subscription: newPlan } : u)));
            } catch (err) {
                alert(`Error updating subscription: ${err.message}. Changes reverted.`);
                fetchAdminData();
            }
        });
    }

    if (authLoading) {
        return (
            <div className="admin-wrapper">
                <div className="admin-status-text">Verifying credentials...</div>
            </div>
        );
    }

    if (!currentUser || !isAdmin) {
        return (
            <div className="admin-wrapper">
                <div className="admin-guard-card">
                    <h2>Access Denied</h2>
                    <p>Administrative privileges are required to view this area.</p>
                    <Link to="/" className="admin-action-btn">Return to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-wrapper">
            <header className="admin-topbar">
                <div>
                    <h1>Administration Console</h1>
                    <p>Platform monitoring, content moderation, and user account management.</p>
                </div>
                <button type="button" className="admin-refresh-btn" onClick={fetchAdminData}>
                    Refresh Data
                </button>
            </header>

            {error && <div className="admin-alert-banner">{error}</div>}

            <div className="admin-nav-tabs" role="tablist">
                <button
                    role="tab"
                    aria-selected={activeTab === "overview"}
                    className={`admin-tab-item ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === "posts"}
                    className={`admin-tab-item ${activeTab === "posts" ? "active" : ""}`}
                    onClick={() => setActiveTab("posts")}
                >
                    Posts ({optimisticPosts.length})
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === "users"}
                    className={`admin-tab-item ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    Users ({optimisticUsers.length})
                </button>
            </div>

            {loading ? (
                <div className="admin-status-text">Loading administration data...</div>
            ) : (
                <div className="admin-content-area">
                    {activeTab === "overview" && stats && (
                        <div className="admin-metrics-row">
                            <div className="admin-metric-card">
                                <h3>Total Registered Users</h3>
                                <div className="metric-primary-value">{stats.users.total}</div>
                                <div className="metric-secondary-info">
                                    <span>{stats.users.paid} Paid</span>
                                    <span className="dot-divider">•</span>
                                    <span>{stats.users.free} Free</span>
                                    <span className="dot-divider">•</span>
                                    <span>{stats.users.admins} Admin</span>
                                </div>
                            </div>

                            <div className="admin-metric-card">
                                <h3>Total Community Posts</h3>
                                <div className="metric-primary-value">{stats.posts.total}</div>
                                <div className="metric-secondary-info">
                                    <span>{stats.posts.questions} Questions</span>
                                    <span className="dot-divider">•</span>
                                    <span>{stats.posts.articles} Articles</span>
                                </div>
                            </div>

                            <div className="admin-metric-card">
                                <h3>Plan Distribution</h3>
                                <div className="metric-primary-value">{stats.posts.paid}</div>
                                <div className="metric-secondary-info">
                                    <span>Paid tier community submissions</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "posts" && (
                        <div className="admin-panel-card">
                            <div className="panel-header-row">
                                <h2>Community Posts</h2>
                                <span className="panel-count">{optimisticPosts.length} total entries</span>
                            </div>
                            <div className="table-responsive">
                                <table className="admin-data-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Type</th>
                                            <th>Plan</th>
                                            <th>Author</th>
                                            <th>Published</th>
                                            <th className="cell-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {optimisticPosts.map(p => (
                                            <tr key={p.id}>
                                                <td className="cell-title">
                                                    <button
                                                        type="button"
                                                        className="post-title-link"
                                                        onClick={() => setSelectedPost(p)}
                                                        title="Click to view full post details"
                                                    >
                                                        {p.title}
                                                    </button>
                                                </td>
                                                <td><span className="badge badge-neutral">{p.type}</span></td>
                                                <td>
                                                    <span className={`badge ${p.plan === "paid" ? "badge-paid" : "badge-free"}`}>
                                                        {p.plan || "free"}
                                                    </span>
                                                </td>
                                                <td className="cell-email">{p.authorEmail || "Not recorded"}</td>
                                                <td className="cell-date">
                                                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                                                </td>
                                                <td className="cell-right">
                                                    <button
                                                        type="button"
                                                        className="btn-delete"
                                                        onClick={() => handleDeletePost(p.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {optimisticPosts.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="table-empty-cell">
                                                    No posts recorded in database.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="admin-panel-card">
                            <div className="panel-header-row">
                                <h2>Registered Users</h2>
                                <span className="panel-count">{optimisticUsers.length} total accounts</span>
                            </div>
                            <div className="table-responsive">
                                <table className="admin-data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Plan</th>
                                            <th>Role</th>
                                            <th className="cell-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {optimisticUsers.map(u => (
                                            <tr key={u.id}>
                                                <td className="cell-name">{u.name || "—"}</td>
                                                <td className="cell-email">{u.email}</td>
                                                <td>
                                                    <span className={`badge ${u.subscription === "paid" ? "badge-paid" : "badge-free"}`}>
                                                        {u.subscription || "free"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${u.role === "admin" || u.isAdmin ? "badge-admin" : "badge-neutral"}`}>
                                                        {u.role === "admin" || u.isAdmin ? "Administrator" : "Standard"}
                                                    </span>
                                                </td>
                                                <td className="cell-right">
                                                    <button
                                                        type="button"
                                                        className="btn-secondary"
                                                        onClick={() => handleTogglePlan(u.id, u.subscription)}
                                                    >
                                                        Switch to {u.subscription === "paid" ? "Free" : "Paid"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* FULL POST DETAIL MODAL FOR ADMIN */}
            {selectedPost && (
                <div className="post-modal-overlay" onClick={() => setSelectedPost(null)}>
                    <div
                        className="post-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-post-title"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="post-modal-header">
                            <div>
                                <div className="post-modal-meta">
                                    <span className="badge badge-neutral">{selectedPost.type}</span>
                                    <span className={`badge ${selectedPost.plan === "paid" ? "badge-paid" : "badge-free"}`}>
                                        {selectedPost.plan || "free"}
                                    </span>
                                    <span className="modal-date">
                                        {selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : "Date unavailable"}
                                    </span>
                                </div>
                                <h2 id="modal-post-title">{selectedPost.title}</h2>
                            </div>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setSelectedPost(null)}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </header>

                        <div className="post-modal-body">
                            {selectedPost.type === "Article" && selectedPost.abstract && (
                                <div className="modal-section">
                                    <h3>Abstract</h3>
                                    <p className="modal-abstract-text">{selectedPost.abstract}</p>
                                </div>
                            )}

                            <div className="modal-section">
                                <h3>{selectedPost.type === "Question" ? "Description" : "Article Content"}</h3>
                                <div className="modal-full-content">
                                    {selectedPost.type === "Question"
                                        ? selectedPost.description
                                        : selectedPost.articleText}
                                </div>
                            </div>

                            {selectedPost.tags && selectedPost.tags.length > 0 && (
                                <div className="modal-section">
                                    <h3>Tags</h3>
                                    <div className="modal-tags-list">
                                        {selectedPost.tags.map(t => (
                                            <span key={t} className="modal-tag-chip">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-author-info">
                                <span>Author UID: <code>{selectedPost.authorId || "N/A"}</code></span>
                                <span>Author Email: <strong>{selectedPost.authorEmail || "Anonymous"}</strong></span>
                            </div>
                        </div>

                        <footer className="post-modal-footer">
                            <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDeletePost(selectedPost.id)}
                            >
                                Delete Post
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSelectedPost(null)}
                            >
                                Close
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
