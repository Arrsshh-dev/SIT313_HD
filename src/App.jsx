import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Hero from "./Hero";
import About from "./About";
import Work from "./Work";
import FeaturedArticles from "./FeaturedArticles";
import FeaturedTutorials from "./FeaturedTutorials";
import Gallery from "./Gallery";
import Footer from "./Footer";
import { AuthProvider } from "./AuthContext";

// Lazy-load page-level components so their JS is only fetched when the user
// navigates to that route. This splits the bundle and reduces initial load time.
const Profile = lazy(() => import("./Profile"));
const Pricing = lazy(() => import("./Pricing"));
const Login = lazy(() => import("./Login"));
const Signup = lazy(() => import("./Signup"));
const Post = lazy(() => import("./Post"));
const BrowsePosts = lazy(() => import("./BrowsePosts"));
const Admin = lazy(() => import("./Admin"));

// Fallback UI shown by <Suspense> while a lazy component's chunk is downloading.
function PageLoader() {
    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            flexDirection: "column",
            gap: "16px",
            color: "#687386",
            fontSize: "15px"
        }}>
            <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid #e3e7ef",
                borderTopColor: "#3157d5",
                borderRadius: "50%",
                animation: "spin 0.75s linear infinite"
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading…
        </div>
    );
}

// The home page assembles all static landing sections in one place.
function Home() {
    return (
        <>
            <Hero />
            <About />
            <Work />
            <FeaturedArticles />
            <FeaturedTutorials />
            <Gallery />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Navbar />

                {/* Suspense catches any lazy component that is still loading and
                    renders PageLoader until the import() promise resolves. */}
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/Post" element={<Post />} />
                        <Route path="/browse-posts" element={<BrowsePosts />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin" element={<Admin />} />
                    </Routes>
                </Suspense>

                <Footer />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
