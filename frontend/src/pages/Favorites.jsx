import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SquareHolder from "../components/SquareHolder";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BACKEND_URL } from "../config";

const Favorites = () => {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load logged-in user
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Load all events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/data`);
        const all = await res.json();
        setEvents(all);
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    }
    fetchEvents();
  }, []);

  // Build favorites list once BOTH user + events exist
  useEffect(() => {
    if (!user || events.length === 0) return;

    const favIds = (user.favoritedEvents || []).map((id) => String(id));

    const favEvents = events.filter((ev) =>
      favIds.includes(String(ev._id)) || favIds.includes(ev.id)
    );

    setFavorites(favEvents);
    setLoading(false);
  }, [user, events]);

  if (loading) return <p className="p-10">Loading your favorites...</p>;

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 pt-28 pb-12">
        <h1 className="text-3xl font-bold mb-10 text-center">
          Your Favorite Events
        </h1>

        {favorites.length === 0 ? (
          <p className="text-gray-500 text-center text-lg">
            You haven’t saved any events yet.
          </p>
        ) : (
          <SquareHolder
            tasks={favorites}
            minItemWidth={260}
            onTaskClick={(task) => {
              window.location.href = `/event-details/${task._id}`;
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;