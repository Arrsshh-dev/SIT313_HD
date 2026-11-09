import { useState } from "react";
import TutorialCard from "./TutorialCard";

import tutorial1 from "./assets/tutorial1.jpg";
import tutorial2 from "./assets/tutorial2.jpg";
import tutorial3 from "./assets/tutorial3.jpg";

function FeaturedTutorials() {
    const [showModal, setShowModal] = useState(false);

    const tutorials = [
        {
            id: 1,
            image: tutorial1,
            title: "Building Your First React App",
            description: "A beginner-friendly guide to creating your first React application.",
            author: "Arsh",
            rating: 4.8
        },
        {
            id: 2,
            image: tutorial2,
            title: "HTML and CSS Basics",
            description: "Learn how to structure and style modern web pages.",
            author: "Arsh",
            rating: 4.6
        },
        {
            id: 3,
            image: tutorial3,
            title: "JavaScript for Beginners",
            description: "Learn the fundamentals of JavaScript through practical examples.",
            author: "Arsh",
            rating: 4.7
        }
    ];

    const extendedTutorials = [
        ...tutorials,
        {
            id: 4,
            image: tutorial1,
            title: "Full Stack Node & Express Setup",
            description: "Create robust REST endpoints with Firebase Admin SDK authentication.",
            author: "DEV@Deakin Community",
            rating: 4.9
        },
        {
            id: 5,
            image: tutorial2,
            title: "React Concurrent Hooks: useTransition",
            description: "Step-by-step tutorial on non-blocking UI rendering and smooth transitions.",
            author: "DEV@Deakin Community",
            rating: 4.8
        },
        {
            id: 6,
            image: tutorial3,
            title: "Two-Factor Auth with One-Time Passcodes",
            description: "Implementing second-factor authentication using transactional emails.",
            author: "DEV@Deakin Community",
            rating: 4.9
        }
    ];

    return (
        <section id="tutorials" className="featured-section alt-bg">
            <div className="section-container">
                <h2 className="section-title">Featured Tutorials</h2>

                <div className="cards-grid">
                    {tutorials.map((tutorial) => (
                        <TutorialCard key={tutorial.id} tutorial={tutorial} />
                    ))}
                </div>

                <div className="section-action">
                    <button
                        type="button"
                        className="btn-outline-primary"
                        onClick={() => setShowModal(true)}
                    >
                        See all tutorials
                    </button>
                </div>
            </div>

            {/* All Tutorials Dialog Modal */}
            {showModal && (
                <div className="catalog-modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="catalog-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="all-tutorials-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="catalog-modal-header">
                            <div>
                                <h2 id="all-tutorials-title">All Community Tutorials</h2>
                                <p>Comprehensive hands-on guides and coding workshops.</p>
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
                                {extendedTutorials.map((tutorial) => (
                                    <TutorialCard key={tutorial.id} tutorial={tutorial} />
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

export default FeaturedTutorials;
