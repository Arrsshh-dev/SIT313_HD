import deakin from "./assets/deakin.png";

function Hero() {
    return (
        <section className="w-full">

            <div className="relative w-full h-[420px] overflow-hidden">

                <img
                    src={deakin}
                    alt="Deakin University"
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <h1 className="text-white text-4xl font-bold">
                        Hey, I'm Arsh
                    </h1>
                </div>

            </div>

        </section>
    );
}

export default Hero;