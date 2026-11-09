import { useState } from "react";
import ArticleCard from "./ArticleCard";

import article1 from "./assets/article1.jpg";
import article2 from "./assets/article2.jpg";
import article3 from "./assets/article3.jpg";

function FeaturedArticles() {
    const [showModal, setShowModal] = useState(false);

    const articles = [
        {
            id: 1,
            image: article1,
            title: "Getting Started with Web Development",
            description: "Learn the basics of modern web development and how websites are created.",
            author: "Arsh",
            rating: 4.5
        },
        {
            id: 2,
            image: article2,
            title: "Introduction to React",
            description: "Understand the fundamentals of creating applications using React.",
            author: "Arsh",
            rating: 4.7
        },
        {
            id: 3,
            image: article3,
            title: "Understanding JavaScript",
            description: "Explore important JavaScript concepts for beginners.",
            author: "Arsh",
            rating: 4.6
        }
    ];

    const extendedArticles = [
        ...articles,
        {
            id: 4,
            image: article1,
            title: "Mastering CSS Grid and Flexbox",
            description: "Deep dive into responsive layout techniques and modern CSS architecture.",
            author: "DEV@Deakin Community",
            rating: 4.9
        },
        {
            id: 5,
            image: article2,
            title: "State Management Patterns in React 19",
            description: "An overview of Context, reducers, and modern concurrency hooks.",
            author: "DEV@Deakin Community",
            rating: 4.8
        },
        {
            id: 6,
            image: article3,
            title: "RESTful API Security with Express & Firebase",
            description: "Best practices for token validation, CORS, and role-based route protection.",
            author: "DEV@Deakin Community",
            rating: 4.9
        }
    ];

    return (
        <section id="articles" className="featured-section">
            <div className="section-container">
                <h2 className="section-title">Featured Articles</h2>

                <div className="cards-grid">
                    {articles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>

                <div className="section-action">
                    <button
                        type="button"
                        className="btn-outline-primary"
                        onClick={() => setShowModal(true)}
                    >
                        See all articles
                    </button>
                </div>
            </div>

            {/* All Articles Dialog Modal */}
            {showModal && (
                <div className="catalog-modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="catalog-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="all-articles-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="catalog-modal-header">
                            <div>
                                <h2 id="all-articles-title">All Community Articles</h2>
                                <p>Curated reading list for developers and students.</p>
                            </div>
                            <button
                                type="button"
                                className="catalog-close-btn"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </header>

                        <div className="catalog-modal-body">
                            <div className="cards-grid">
                                {extendedArticles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </div>

                        <footer className="catalog-modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </section>
    );
}

export default FeaturedArticles;
