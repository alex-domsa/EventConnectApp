// frontend/src/pages/EditEvent.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../index.css";
import { Calendar, Clock, MapPin, Users, Save, X } from "lucide-react";



function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState({
    eventName: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    image: "",
    club: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch existing event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/data/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        // attach raw event first
        setEvent((prev) => ({ ...prev, ...data }));

        // if event doesn't include full club object but has a clubId/club reference, fetch club
        const maybeClubId =
          data.club && typeof data.club === "string"
            ? data.club
            : data.clubId || data.club_id || (data.club && data.club._id) || null;

        if (!data.club && maybeClubId) {
          try {
            const clubRes = await fetch(`${BACKEND_URL}/api/search/clubs/${maybeClubId}`);
            if (clubRes.ok) {
              const clubJson = await clubRes.json();
              const clubData = clubJson.data ?? clubJson;
              setEvent((prev) => ({ ...prev, club: clubData }));
            }
          } catch (err) {
            // ignore club fetch errors (still show event)
            console.debug("Failed to fetch club for event:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        alert("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/data/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(event),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.message || body?.error || "Failed to update event";
        throw new Error(msg);
      }
      alert("Event updated successfully!");
      navigate(`/event/${id}`); // go back to details page
    } catch (err) {
      console.error("Error updating event:", err);
      alert("There was a problem updating the event.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-muted">Loading event…</p>;

  // Prefer event image, fallback to club logo, then other fallbacks
  const previewImage =
    event.image ||
    event.poster ||
    event.photo ||
    event.imageUrl ||
    event.posterUrl ||
    event.club?.logo ||
    event.club?.image ||
    "/src/assets/MAYNOOTHLOGO.png";

  const clubName = event.club?.name || event.club?.clubName || "Unknown Club";
  const clubImage =
    event.club?.logo || event.club?.image || event.club?.photo || event.club?.avatar || "/src/assets/MAYNOOTHLOGO.png";

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="edit-event-container">
          <header className="edit-hero">
            <div className="hero-left">
              <img src={previewImage} alt="event visual" className="hero-image" />
            </div>
            <div className="hero-body">
              <h1 className="hero-title">{event.eventName || "Untitled Event"}</h1>
              <p className="hero-sub">{event.tagline || event.subtitle || "Update event details and preview changes live."}</p>

              <div className="hero-meta">
                <span className="meta-item"><Calendar className="meta-icon" /> {event.date || "TBD"}</span>
                <span className="meta-item"><Clock className="meta-icon" /> {event.startTime ? `${event.startTime}${event.endTime ? ` — ${event.endTime}` : ""}` : "TBD"}</span>
                <span className="meta-item"><MapPin className="meta-icon" /> {event.location || "TBD"}</span>
              </div>

              <div className="club-chip">
                <img src={clubImage} alt={clubName} className="club-avatar" />
                <div className="club-info">
                  <div className="club-name"><Users className="inline w-4 h-4 mr-2" />{clubName}</div>
                  <div className="club-sub muted">Club details & settings</div>
                </div>
              </div>
            </div>
            <div className="hero-actions">
              <button onClick={() => navigate(-1)} className="btn-outline">
                <X className="w-4 h-4 mr-2" /> Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </header>

          <section className="edit-grid">
            <form className="edit-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label className="field-label">Event name</label>
                <input name="eventName" value={event.eventName || ""} onChange={handleChange} required className="input" />
              </div>

              <div className="form-row grid-3">
                <div>
                  <label className="field-label">Date</label>
                  <input name="date" value={event.date || ""} onChange={handleChange} placeholder="MM/DD/YYYY" className="input" />
                </div>
                <div>
                  <label className="field-label">Start time</label>
                  <input name="startTime" value={event.startTime || ""} onChange={handleChange} placeholder="HH:MM" className="input" />
                </div>
                <div>
                  <label className="field-label">End time</label>
                  <input name="endTime" value={event.endTime || ""} onChange={handleChange} placeholder="HH:MM" className="input" />
                </div>
              </div>

              <div className="form-row">
                <label className="field-label">Location</label>
                <input name="location" value={event.location || ""} onChange={handleChange} placeholder="Room/venue" className="input" />
              </div>

              <div className="form-row">
                <label className="field-label">Image URL</label>
                <input name="image" value={event.image || ""} onChange={handleChange} placeholder="https://..." className="input" />
              </div>

              <div className="form-row">
                <label className="field-label">Description</label>
                <textarea name="description" value={event.description || ""} onChange={handleChange} rows={6} className="textarea" />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => { setEvent((p) => ({ ...p, description: "" })); }} className="btn-ghost">Clear</button>
                <button type="submit" className="btn-primary">{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>

            <aside className="edit-preview">
              <div className="preview-card">
                <img src={previewImage} alt="preview" className="preview-image" />
                <div className="preview-body">
                  <h3 className="preview-title">{event.eventName || "Untitled Event"}</h3>
                  <div className="preview-meta muted">
                    <div><Calendar className="inline w-4 h-4 mr-2" />{event.date || "TBD"}</div>
                    <div><Clock className="inline w-4 h-4 mr-2" />{event.startTime || "TBD"}</div>
                    <div><MapPin className="inline w-4 h-4 mr-2" />{event.location || "TBD"}</div>
                  </div>
                  <p className="preview-desc">{event.description || "No description provided."}</p>
                </div>
              </div>
            </aside>
          </section>
        </div>

      </main>
    </div>

  );
}

export default EditEvent;
