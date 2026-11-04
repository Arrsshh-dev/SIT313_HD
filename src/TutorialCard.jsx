function TutorialCard({ tutorial }) {
    return (
        <article className="bg-gray-50 rounded-lg overflow-hidden">

            <img
                src={tutorial.image}
                alt={tutorial.title}
                className="w-full h-48 object-cover"
            />

            <div className="p-5">

                <h3 className="text-xl font-semibold text-center mb-3">
                    {tutorial.title}
                </h3>

                <p className="text-gray-700 text-center">
                    {tutorial.description}
                </p>

                <div className="flex justify-between mt-4 text-sm text-gray-500">
                    <span>
                        By {tutorial.author}
                    </span>

                    <span>
                        ⭐ {tutorial.rating}
                    </span>
                </div>

            </div>

        </article>
    );
}

export default TutorialCard;