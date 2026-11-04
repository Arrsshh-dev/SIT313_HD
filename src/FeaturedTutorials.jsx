import TutorialCard from "./TutorialCard";

import tutorial1 from "./assets/tutorial1.jpg";
import tutorial2 from "./assets/tutorial2.jpg";
import tutorial3 from "./assets/tutorial3.jpg";

function FeaturedTutorials() {

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

    return (
        <section
    id="tutorials"
    className="w-full flex justify-center py-8"
>
    <div className="w-full max-w-6xl px-6">

        <div className="text-center mb-8">

        
<br></br>
            <h2 className="text-teal-500 text-2xl">
                Featured Tutorials
            </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {tutorials.map((tutorial) => (
                <TutorialCard
                    key={tutorial.id}
                    tutorial={tutorial}
                />
            ))}

        </div>

        <div className="flex justify-center mt-8">

            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-700">
                See all tutorials
            </button>

        </div>

    </div>
</section>
    );
}

export default FeaturedTutorials;