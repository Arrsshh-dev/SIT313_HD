function ArticleCard({ article }) {
    return (
        <article className="bg-gray-50 rounded-lg overflow-hidden">

            <img
                src={article.image}
                alt={article.title}
                className="w-full h-48 object-cover"
            />

            <div className="p-5">

                <h3 className="text-xl font-semibold text-center mb-3">
                    {article.title}
                </h3>

                <p className="text-gray-700 text-center">
                    {article.description}
                </p>

                <div className="flex justify-between mt-4 text-sm text-gray-500">
                    <span>
                        By {article.author}
                    </span>

                    <span>
                        ⭐ {article.rating}
                    </span>
                </div>

            </div>

        </article>
    );
}

export default ArticleCard;