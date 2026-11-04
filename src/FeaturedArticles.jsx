import ArticleCard from "./ArticleCard";

import article1 from "./assets/article1.jpg";
import article2 from "./assets/article2.jpg";
import article3 from "./assets/article3.jpg";

function FeaturedArticles() {

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

    return (
    <section
    id="articles"
    className="w-full flex justify-center py-8"
>
    
    <div className="w-full max-w-6xl px-6">

        <div className="text-center mb-8">

        
<br></br>
            <h2 className="text-teal-500 text-2xl">
                Featured Articles
            </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {articles.map((article) => (
                <ArticleCard
                    key={article.id}
                    article={article}
                />
            ))}

        </div>

        <div className="flex justify-center mt-8">

            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-700">
                See all articles
            </button>

        </div>

    </div>
</section>
    );
}

export default FeaturedArticles;