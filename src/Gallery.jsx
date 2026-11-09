import gallery1 from "./assets/gallery1.jpg";
import gallery2 from "./assets/gallery2.jpg";
import gallery3 from "./assets/gallery3.jpg";
import gallery4 from "./assets/gallery4.jpg";

function Gallery() {
    const images = [gallery1, gallery2, gallery3, gallery4];

    return (
        <section id="gallery" className="gallery-section">
            <div className="section-container">
                <h2 className="section-title">Campus & Community Gallery</h2>
                <div className="gallery-grid">
                    {images.map((image, index) => (
                        <div key={index} className="gallery-item">
                            <img
                                src={image}
                                alt={`Community gallery item ${index + 1}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Gallery;
