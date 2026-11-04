import Me from "./assets/Me.jpeg";

function About() {
    return (
        <section
            id="about"
            className="w-full flex justify-center text-center py-12"
        >
            <br>
            </br>
            <div className="w-full max-w-3xl px-6 flex flex-col items-center">

                <img
                    src={Me}
                    alt="Profile"
                    className="w-48 h-48 rounded-full object-cover mx-auto"
                />

                <p className="text-teal-500 text-xl mt-8 text-center">
                    I am a full-stack web developer based in Punjab,India.
                </p>

                <div className="w-3/4 h-[3px] bg-teal-500 mx-auto my-8"></div>

                <h2 className="text-teal-500 text-2xl text-center">
                    Here's what I've done so far
                </h2>

            </div>
        </section>
    );
}

export default About;