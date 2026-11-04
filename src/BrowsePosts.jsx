import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import "./BrowsePosts.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function BrowsePosts() {
    const { currentUser, subscription, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState("");
    const [type, setType] = useState("all");
    const [plan, setPlan] = useState("all");
    const [tag, setTag] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [hidden, setHidden] = useState([]);
    const [expanded, setExpanded] = useState([]);

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
            if (currentUser) headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
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

    const visiblePosts = useMemo(() => posts.filter(post => !hidden.includes(post.id)), [posts, hidden]);

    function reset() {
        setType("all"); setPlan("all"); setTag(""); setFrom(""); setTo("");
        setHidden([]); setExpanded([]);
    }
    function toggle(list, setter, id) {
        setter(list.includes(id) ? list.filter(item => item !== id) : [...list, id]);
    }

    return (
        <main className="browse-page">
            <header className="browse-heading">
                <div><p className="browse-eyebrow">DEV@Deakin community</p><h1>Browse Posts</h1>
                    <p>Explore questions and articles shared by the community.</p></div>
                <span className={`plan-pill ${subscription === "paid" ? "paid" : ""}`}>
                    {currentUser ? `${subscription === "paid" ? "Paid" : "Free"} member` : "Visitor · Free access"}
                </span>
            </header>

            <section className="browse-filters" aria-label="Filter posts">
                <div className="filter-field"><label htmlFor="filter-type">Post type</label>
                    <select id="filter-type" value={type} onChange={e => setType(e.target.value)}>
                        <option value="all">All types</option><option value="Question">Questions</option><option value="Article">Articles</option>
                    </select></div>
                <div className="filter-field"><label htmlFor="filter-plan">Access plan</label>
                    <select id="filter-plan" value={plan} onChange={e => setPlan(e.target.value)}>
                        <option value="all">All available plans</option><option value="free">Free</option>
                        {subscription === "paid" && <option value="paid">Paid</option>}
                    </select></div>
                <div className="filter-field"><label htmlFor="filter-tag">Tag</label>
                    <input id="filter-tag" value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. React" /></div>
                <div className="filter-field"><label htmlFor="filter-from">Created from</label>
                    <input id="filter-from" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
                <div className="filter-field"><label htmlFor="filter-to">Created to</label>
                    <input id="filter-to" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
                <button className="filter-reset" type="button" onClick={reset}>Reset filters & hidden posts</button>
            </section>

            <div className="browse-results"><strong>{visiblePosts.length}</strong> {visiblePosts.length === 1 ? "post" : "posts"} shown
                <span>Only posts permitted by your account are returned by the server.</span></div>

            {busy && <p className="browse-message">Loading community posts…</p>}
            {error && <div className="browse-error" role="alert">{error}</div>}
            {!busy && !error && visiblePosts.length === 0 && <div className="browse-empty"><h2>No posts found</h2><p>Try changing your filters or reset hidden posts.</p></div>}

            <section className="post-list">
                {visiblePosts.map(post => {
                    const isExpanded = expanded.includes(post.id);
                    const body = post.type === "Question" ? post.description : post.articleText;
                    return <article className="community-post" key={post.id}>
                        <div className="community-post-top">
                            <div className="post-chips"><span>{post.type}</span><span className={post.plan === "paid" ? "chip-paid" : "chip-free"}>{post.plan || "free"}</span></div>
                            <time>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Date unavailable"}</time>
                        </div>
                        <button className="post-expand" type="button" onClick={() => toggle(expanded, setExpanded, post.id)} aria-expanded={isExpanded}>
                            <h2>{post.title}</h2><span>{isExpanded ? "Collapse −" : "Read full post +"}</span>
                        </button>
                        {post.type === "Article" && <p className="post-abstract">{post.abstract}</p>}
                        <p className={isExpanded ? "post-body expanded" : "post-body"}>{body}</p>
                        <div className="post-tags">{(post.tags || []).map(t => <span key={t}>#{t}</span>)}</div>
                        <div className="community-post-bottom"><small>Shared by {post.authorEmail || "DEV@Deakin member"}</small>
                            <button type="button" className="hide-post" onClick={() => setHidden(old => [...old, post.id])}>Hide from my list</button></div>
                    </article>;
                })}
            </section>
        </main>
    );
}
export default BrowsePosts;
