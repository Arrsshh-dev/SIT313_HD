import Me from "./assets/Me.jpeg";

function About() {
    return (
        <section id="about" className="about-section">
            <div className="section-container">
                <div className="about-content">
                    <img
                        src={Me}
                        alt="Profile"
                        className="about-avatar"
                    />
                    <p className="about-lead">
                        I am a full-stack web developer based in Punjab, India.
                    </p>
                    <div className="about-divider" />
                    <h2 className="section-title">
                        Here's what I've done so far
                    </h2>
                </div>
            </div>
        </section>
    );
}

export default About;
