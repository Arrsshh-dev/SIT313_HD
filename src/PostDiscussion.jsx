import { useState, useEffect, useOptimistic, useTransition, useCallback } from "react";
import { useAuth } from "./AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function PostDiscussion({ postId }) {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [, startTransition] = useTransition();

    // Advanced React 19 Hook: useOptimistic for immediate comment display
    const [optimisticComments, addOptimisticComment] = useOptimistic(
        comments,
        (current, newComment) => [...current, newComment]
    );

    const loadComments = useCallback(async () => {
        try {
            const res = await fetch(`${API}/posts/${postId}/comments`);
            const data = await res.json();
            if (res.ok) {
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error("Error loading discussion comments:", err);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    async function handlePostComment(e) {
        e.preventDefault();
        if (!commentText.trim() || !currentUser) return;

        const optimisticId = `temp-${Date.now()}`;
        const cleanText = commentText.trim();
        setCommentText("");
        setSubmitting(true);

        startTransition(async () => {
            // Instantly render comment in discussion stream
            addOptimisticComment({
                id: optimisticId,
                text: cleanText,
                authorEmail: currentUser.email || "You",
                createdAt: new Date().toISOString()
            });

            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${API}/posts/${postId}/comments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ text: cleanText })
                });

                if (!res.ok) throw new Error("Could not save comment.");

                const savedComment = await res.json();
                setComments(prev => [...prev, savedComment]);
            } catch (err) {
                console.error("Comment failed:", err);
                alert("Failed to submit comment. Changes rolled back.");
                loadComments();
            } finally {
                setSubmitting(false);
            }
        });
    }

    return (
        <section className="post-discussion-section">
            <h3 className="discussion-heading">
                Discussion & Community Answers ({optimisticComments.length})
            </h3>

            {loading ? (
                <p className="discussion-loading">Loading responses…</p>
            ) : optimisticComments.length === 0 ? (
                <p className="discussion-empty">No responses yet. Be the first to share your thoughts!</p>
            ) : (
                <div className="discussion-list">
                    {optimisticComments.map(c => (
                        <div key={c.id} className="discussion-item">
                            <div className="discussion-item-top">
                                <strong>{c.authorEmail}</strong>
                                <time>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now"}</time>
                            </div>
                            <p className="discussion-item-text">{c.text}</p>
                        </div>
                    ))}
                </div>
            )}

            {currentUser ? (
                <form className="discussion-form" onSubmit={handlePostComment}>
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a helpful answer or constructive reply..."
                        rows={3}
                        required
                        maxLength={2000}
                    />
                    <div className="discussion-form-actions">
                        <small>{commentText.length}/2000 characters</small>
                        <button
                            type="submit"
                            className="btn-submit-comment"
                            disabled={submitting || !commentText.trim()}
                        >
                            {submitting ? "Posting..." : "Post Reply"}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="discussion-auth-notice">
                    Please log in to participate in this discussion.
                </p>
            )}
        </section>
    );
}

export default PostDiscussion;
