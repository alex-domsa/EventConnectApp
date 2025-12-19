import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapContainer, TileLayer } from 'react-leaflet';

const campusCenter = [53.3829, -6.6026];

function MapPage() {
    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <Navbar />

            {/* main grows to push footer down */}
            <main className="flex-1 pt-24 pb-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <header className="px-6 py-4 border-b border-border">
                            <h1 className="text-2xl font-semibold">Campus Map</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Explore Maynooth University and find event locations.
                            </p>
                        </header>
                        <div className="w-full" style={{ height: '70vh' }}>
                            <MapContainer
                                center={campusCenter}
                                zoom={16}
                                scrollWheelZoom
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                            </MapContainer>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default MapPage;

