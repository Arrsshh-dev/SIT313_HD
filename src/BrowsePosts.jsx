import { useCallback, useEffect, useMemo, useState, useTransition, useDeferredValue, useOptimistic } from "react";
import { useAuth } from "./AuthContext";
import PostDiscussion from "./PostDiscussion";
import "./BrowsePosts.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function BrowsePosts() {
    const { currentUser, subscription, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState("");
    
    // Server query parameters
    const [type, setType] = useState("all");
    const [plan, setPlan] = useState("all");
    const [tag, setTag] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    
    // Client-side interactions
    const [hidden, setHidden] = useState([]);
    const [expanded, setExpanded] = useState([]);

    // Advanced React Concept 1: Instant search with useDeferredValue
    const [searchQuery, setSearchQuery] = useState("");
    const deferredSearchQuery = useDeferredValue(searchQuery);

    // Advanced React Concept 2: useTransition for smooth, non-blocking filter transitions
    const [isFiltering, startTransition] = useTransition();

    // Advanced React Concept 3: useOptimistic (React 19) for instant upvoting / likes
    // When a user clicks Like, optimisticPosts updates immediately in the UI without network delay.
    // If the server request fails, React 19 automatically rolls back to the prior state.
    const [optimisticPosts, setOptimisticPosts] = useOptimistic(
        posts,
        (currentPosts, { postId, userId }) => {
            return currentPosts.map(p => {
                if (p.id !== postId) return p;
                const likes = Array.isArray(p.likes) ? p.likes : [];
                const alreadyLiked = likes.includes(userId);
                const updatedLikes = alreadyLiked
                    ? likes.filter(id => id !== userId)
                    : [...likes, userId];
                return {
                    ...p,
                    likes: updatedLikes,
                    likeCount: updatedLikes.length
                };
            });
        }
    );

    // Fetch posts from backend with access control enforced by server
    const loadPosts = useCallback(async () => {
        setBusy(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (type !== "all") params.set("type", type);
            if (plan !== "all") params.set("plan", plan);
            if (tag.trim()) params.set("tag", tag.trim());
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            
            const headers = {};
            if (currentUser) {
                headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
            }
            
            const response = await fetch(`${API}/posts?${params.toString()}`, { headers });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not load posts.");
            setPosts(data.posts || []);
        } catch (err) {
            setError(err.message || "Could not load posts. Check that the backend is running.");
        } finally {
            setBusy(false);
        }
    }, [currentUser, type, plan, tag, from, to]);

    useEffect(() => {
        if (!authLoading) loadPosts();
    }, [authLoading, loadPosts]);

    // Filter out hidden posts and apply deferred search query over title, description, abstract, and tags
    const visiblePosts = useMemo(() => {
        return optimisticPosts
            .filter(post => !hidden.includes(post.id))
            .filter(post => {
                if (!deferredSearchQuery.trim()) return true;
                const q = deferredSearchQuery.toLowerCase();
                const titleMatch = (post.title || "").toLowerCase().includes(q);
                const descMatch = (post.description || "").toLowerCase().includes(q);
                const abstractMatch = (post.abstract || "").toLowerCase().includes(q);
                const tagMatch = (post.tags || []).some(t => t.toLowerCase().includes(q));
                return titleMatch || descMatch || abstractMatch || tagMatch;
            });
    }, [optimisticPosts, hidden, deferredSearchQuery]);

    // Handle Upvoting / Liking with useOptimistic
    async function handleLikePost(postId) {
        if (!currentUser) {
            alert("Please log in to like community posts.");
            return;
        }

        startTransition(async () => {
            // Apply instant optimistic update in UI
            setOptimisticPosts({ postId, userId: currentUser.uid });

            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${API}/posts/${postId}/like`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error("Failed to like post.");
                }

                const result = await res.json();

                // Synchronize confirmed backend state
                setPosts(prev => prev.map(p => {
                    if (p.id !== postId) return p;
                    const likes = Array.isArray(p.likes) ? p.likes : [];
                    const updatedLikes = result.liked
                        ? [...likes.filter(id => id !== currentUser.uid), currentUser.uid]
                        : likes.filter(id => id !== currentUser.uid);
                    return {
                        ...p,
                        likes: updatedLikes,
                        likeCount: result.likeCount
                    };
                }));
            } catch (err) {
                console.error("Like failed:", err);
                loadPosts(); // Roll back
            }
        });
    }

    // Handlers wrapped in startTransition for non-blocking UI responsiveness
    function handleTypeChange(val) {
        startTransition(() => {
            setType(val);
        });
    }

    function handlePlanChange(val) {
        startTransition(() => {
            setPlan(val);
        });
    }

    function reset() {
        startTransition(() => {
            setType("all");
            setPlan("all");
            setTag("");
            setFrom("");
            setTo("");
            setSearchQuery("");
            setHidden([]);
            setExpanded([]);
        });
    }

    function toggle(list, setter, id) {
        setter(list.includes(id) ? list.filter(item => item !== id) : [...list, id]);
    }

    return (
        <main className="browse-page">
            <header className="browse-heading">
                <div>
                    <p className="browse-eyebrow">DEV@Deakin community</p>
                    <h1>Browse Posts</h1>
                    <p>Explore questions and articles shared by the community.</p>
                </div>
                <span className={`plan-pill ${subscription === "paid" ? "paid" : ""}`}>
                    {currentUser ? `${subscription === "paid" ? "Paid" : "Free"} member` : "Visitor · Free access"}
                </span>
            </header>

            {/* Instant Search Bar demonstrating useDeferredValue */}
            <div className="browse-search-bar" style={{ marginBottom: "16px" }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search across titles, descriptions, and tags..."
                    aria-label="Search posts"
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #c9d2e3",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                        boxSizing: "border-box"
                    }}
                />
            </div>

            <section className="browse-filters" aria-label="Filter posts">
                <div className="filter-field">
                    <label htmlFor="filter-type">Post type</label>
                    <select
                        id="filter-type"
                        value={type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                    >
                        <option value="all">All types</option>
                        <option value="Question">Questions</option>
                        <option value="Article">Articles</option>
                    </select>
                </div>

                <div className="filter-field">
                    <label htmlFor="filter-plan">Access plan</label>
                    <select
                        id="filter-plan"
                        value={plan}
                        onChange={(e) => handlePlanChange(e.target.value)}
                    >
                        <option value="all">All available plans</option>
                        <option value="free">Free</option>
                        {subscription === "paid" && <option value="paid">Paid</option>}
                    </select>
                </div>

                <div className="filter-field">
                    <label htmlFor="filter-tag">Tag</label>
                    <input
                        id="filter-tag"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="e.g. React"
                    />
                </div>

                <div className="filter-field">
                    <label htmlFor="filter-from">Created from</label>
                    <input
                        id="filter-from"
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                </div>

                <div className="filter-field">
                    <label htmlFor="filter-to">Created to</label>
                    <input
                        id="filter-to"
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>

                <button className="filter-reset" type="button" onClick={reset}>
                    Reset filters & hidden posts
                </button>
            </section>

            <div className="browse-results">
                <strong>{visiblePosts.length}</strong> {visiblePosts.length === 1 ? "post" : "posts"} shown
                {isFiltering && <span style={{ marginLeft: "12px", color: "#3157d5" }}>Updating list...</span>}
                <span style={{ marginLeft: "auto" }}>Only posts permitted by your account are returned by the server.</span>
            </div>

            {busy && <p className="browse-message">Loading community posts…</p>}
            {error && <div className="browse-error" role="alert">{error}</div>}
            {!busy && !error && visiblePosts.length === 0 && (
                <div className="browse-empty">
                    <h2>No posts found</h2>
                    <p>Try changing your filters, search term, or reset hidden posts.</p>
                </div>
            )}

            <section className="post-list" style={{ opacity: isFiltering ? 0.7 : 1, transition: "opacity 0.15s ease" }}>
                {visiblePosts.map((post) => {
                    const isExpanded = expanded.includes(post.id);
                    const body = post.type === "Question" ? post.description : post.articleText;
                    const likesList = Array.isArray(post.likes) ? post.likes : [];
                    const isLiked = currentUser ? likesList.includes(currentUser.uid) : false;
                    const count = post.likeCount || likesList.length || 0;

                    return (
                        <article className="community-post" key={post.id}>
                            <div className="community-post-top">
                                <div className="post-chips">
                                    <span>{post.type}</span>
                                    <span className={post.plan === "paid" ? "chip-paid" : "chip-free"}>
                                        {post.plan || "free"}
                                    </span>
                                </div>
                                <time>
                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Date unavailable"}
                                </time>
                            </div>

                            <button
                                className="post-expand"
                                type="button"
                                onClick={() => toggle(expanded, setExpanded, post.id)}
                                aria-expanded={isExpanded}
                            >
                                <h2>{post.title}</h2>
                                <span>{isExpanded ? "Collapse −" : "Read full post +"}</span>
                            </button>

                            {post.type === "Article" && <p className="post-abstract">{post.abstract}</p>}
                            <p className={isExpanded ? "post-body expanded" : "post-body"}>{body}</p>
                            <div className="post-tags">
                                {(post.tags || []).map((t) => (
                                    <span key={t}>#{t}</span>
                                ))}
                            </div>

                            {/* Embedded Discussion & Live Q&A Section when post is expanded */}
                            {isExpanded && <PostDiscussion postId={post.id} />}

                            <div className="community-post-bottom">
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {/* Optimistic Like Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleLikePost(post.id)}
                                        className={`post-like-button ${isLiked ? "liked" : ""}`}
                                        title={isLiked ? "Unlike post" : "Like post"}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill={isLiked ? "#008f95" : "none"}
                                            stroke={isLiked ? "#008f95" : "#687386"}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                                        </svg>
                                        <span>{count}</span>
                                    </button>

                                    <small>Shared by {post.authorEmail || "DEV@Deakin member"}</small>
                                </div>

                                <button
                                    type="button"
                                    className="hide-post"
                                    onClick={() => setHidden((old) => [...old, post.id])}
                                >
                                    Hide from my list
                                </button>
                            </div>
                        </article>
                    );
                })}
            </section>
        </main>
    );
}

export default BrowsePosts;
