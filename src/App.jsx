
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./Profile";
import Navbar from "./Navbar";
import Hero from "./Hero";
import About from "./About";
import Work from "./Work";
import FeaturedArticles from "./FeaturedArticles";
import FeaturedTutorials from "./FeaturedTutorials";
import Gallery from "./Gallery";
import Footer from "./Footer";
import Pricing from "./Pricing";
import Login from "./Login";
import Signup from "./Signup";
import Post from "./Post";
import BrowsePosts from "./BrowsePosts";
import { AuthProvider } from "./AuthContext";

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

                <Routes>
                    <Route
                        path="/"
                        element={<Home />}
                    />
                    <Route
                        path="/Post"
                        element={<Post />}
                    />
                    <Route path="/browse-posts" element={<BrowsePosts />} />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/signup"
                        element={<Signup />}
                    />
                    <Route path="/pricing" element={<Pricing />} />

                    <Route path="/profile" element={<Profile />} />
                </Routes>

                <Footer />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
