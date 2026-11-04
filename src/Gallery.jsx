import gallery1 from "./assets/gallery1.jpg";
import gallery2 from "./assets/gallery2.jpg";
import gallery3 from "./assets/gallery3.jpg";
import gallery4 from "./assets/gallery4.jpg";

function Gallery() {

    const images = [
        gallery1,
        gallery2,
        gallery3,
        gallery4
    ];

    return (
        
        <section className="w-full pt-2">
<br>
</br>
            <div className="text-center mb-12">

            

                <h2 className="text-teal-500 text-2xl">
                    My photos
                </h2>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-0">

                {images.map((image, index) => (
                    <img
                        key={index}
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-72 object-cover rounded-md"
                    />
                ))}

            </div>

        </section>
    );
}

export default Gallery;