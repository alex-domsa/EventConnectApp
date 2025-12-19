// frontend/src/pages/CreateEvent.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { BACKEND_URL } from "../config.js";

export default function CreateEvent() {
  const navigate = useNavigate();

  // Safely read user from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState({
    eventName: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    clubId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Can create events if super admin OR club admin
  const canCreate = !!user?.isSuperAdmin || !!user?.isAdmin;

  // Fetch all clubs, then filter client-side to adminOf
  useEffect(() => {
    if (!canCreate) return;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/search/clubs`);
        if (!res.ok) throw new Error("Failed to fetch clubs");
        const data = await res.json();

        const allClubs = data.data || data; // depending on controller shape
        if (!Array.isArray(allClubs)) {
          setClubs([]);
          return;
        }

        // Super admin: can pick any club
        if (user?.isSuperAdmin) {
          setClubs(allClubs);
          return;
        }

        // Regular club admin: only clubs in adminOf
        if (!Array.isArray(user?.adminOf) || !user?.isAdmin) {
          setClubs([]);
          return;
        }

        const adminIdSet = new Set(user.adminOf.map((id) => id.toString()));
        const filtered = allClubs.filter((club) =>
          adminIdSet.has(club._id.toString())
        );
        setClubs(filtered);
      } catch (err) {
        console.error("Error fetching clubs:", err);
        setError("Could not load your admin clubs.");
      }
    })();
  }, [canCreate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Create event error:", data);
        setError(data.message || data.error || "Failed to create event.");
        setLoading(false);
        return;
      }

      alert("Event created successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Network error while creating event.");
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center pt-24">
          <p>You must be an admin to create events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-3xl mx-auto pt-24 pb-12 px-4">
        <h1 className="text-2xl font-semibold mb-4">Create New Event</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 border border-red-300 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Event Name
            </label>
            <input
              name="eventName"
              value={form.eventName}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                name="date"
                value={form.date}
                onChange={handleChange}
                placeholder="MM/DD/YYYY"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                placeholder="HH:MM:SS"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Time
              </label>
              <input
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                placeholder="HH:MM:SS"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Club (you admin)
            </label>
            <select
              name="clubId"
              value={form.clubId}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Select a club</option>
              {clubs.map((club) => (
                <option key={club._id} value={club._id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-md border text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
