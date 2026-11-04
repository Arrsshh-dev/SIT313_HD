import Proj from "./assets/Proj.jpeg";
import proj2 from "./assets/proj2.jpg";

function Work() {
    return (
        <section
            id="work"
            className="w-full flex justify-center py-8"
        >

            <div className="w-full max-w-3xl px-6">
                <br>
                </br>
                <div className="bg-gray-50 rounded-lg p-3 mb-5 flex items-center gap-5">

                    <img
                        src={Proj}
                        alt="HealthSync"
                        className="w-32 h-24 object-cover rounded-md flex-shrink-0"
                    />

                    <p className="text-lg flex-1 text-center">
                        <strong>HEALTHSYNC:</strong> An IoT-based Elderly Health
                        monitoring system. Uses sensors such as:
                        MAX30102, MLX90614, DHT11 etc. Sends
                        Email alerts in case of an emergency.
                    </p>

                </div>
                <br>
                </br>
                <div className="bg-gray-50 rounded-lg p-3 mb-5 flex items-center gap-5">

                    <img
                        src={proj2}
                        alt="CampusGrid"
                        className="w-32 h-24 object-cover rounded-md flex-shrink-0"
                    />

                    <p className="text-lg flex-1 text-center">
                        <strong>CAMPUSGRID:</strong> A hackathon winning
                        software solution which is a campus
                        distributed computing platform
                    </p>

                </div>

            </div>

        </section>
    );
}

export default Work;