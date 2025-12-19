import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ImageDragAndDrop from "../components/ImageDragAndDrop";

import { BACKEND_URL } from "../config.js";
import ClubSelector from "../components/ClubSelector";

export default function AddEvent() {
  const navigate = useNavigate();
  const [selectedClubId, setSelectedClubId] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [form, setForm] = useState({
    eventName: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    RSVPNeeded: false,
    tags: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setMsg("");
  };

  const validate = () => {
    if (!form.eventName.trim()) return "Event name is required";
    if (!form.date) return "Date is required";
    if (!form.startTime) return "Start time is required";
    if (!form.endTime) return "End time is required";
    if (!form.location.trim()) return "Location is required";
    if (!form.description.trim()) return "Description is required";
    if (!selectedClubId) return "Please select an organising club";
    // quick time ordering check on same day
    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(`${form.date}T${form.endTime}`);
    if (!(end > start)) return "End time must be after start time";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const user = (() => {
        try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
      })();

      const payload = {
        eventName: form.eventName.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location.trim(),
        description: form.description.trim(),
        RSVPNeeded: !!form.RSVPNeeded,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        createdBy: user ? (user._id || user.id) : undefined,
        clubId: selectedClubId,
        image: imageUrl || undefined,
      };

      const token = localStorage.getItem('token'); // get JWT (set by login/oauth)
      const res = await fetch(`${BACKEND_URL}/api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      setMsg("Event Added");
      setTimeout(() => navigate("/dashboard"), 350);
    } catch (e2) {
      console.error(e2);
      setMsg(e2.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const shell = { maxWidth: 520, margin: "0 auto", textAlign: "left" };
  const row = { display: "flex", flexDirection: "column", gap: 6 };
  const label = { fontWeight: 600, fontSize: 14 };
  const input = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" };
  const actions = { display: "flex", gap: 10, marginTop: 12 };

  // ensure the main content can scroll and starts at the top
  const mainRef = useRef(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      <Navbar />

      {/* make the page main scrollable and constrained to viewport height minus navbar */}
      <main
        ref={mainRef}
        className="flex-1 overflow-auto"
        // push content down so the fixed navbar doesn't overlap the form
        style={{
          maxHeight: "calc(100vh - var(--navbar-height, 64px))",
          paddingTop: "calc(var(--navbar-height, 64px) + 16px)"
        }}
      >
        {/* Page-scoped override: force Club select to use white background + black text here */}
        <style>{`
          /* Only target the ClubSelector inside AddEvent */
          .add-event-club-select select,
          .add-event-club-select select option {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        `}</style>

        <h2>Add Event</h2>
        <form onSubmit={handleSubmit} style={{ ...shell, display: "grid", gap: 12 }}>

          {/* wrap ClubSelector so the page-scoped CSS above applies only here */}
          <div className="add-event-club-select">
            <ClubSelector value={selectedClubId} onChange={setSelectedClubId} />
          </div>
          {/* pass uploaded image URL up to this page */}

          <div style={row}>
            <label style={label} htmlFor="eventName">Event Name</label>
            <input id="eventName" name="eventName" value={form.eventName} onChange={handleChange} style={input} required />
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <div style={row}>
              <label style={label} htmlFor="date">Date</label>
              <input id="date" name="date" type="date" value={form.date} onChange={handleChange} style={input} required />
            </div>
            <div style={row}>
              <label style={label} htmlFor="location">Location</label>
              <input id="location" name="location" value={form.location} onChange={handleChange} style={input} required />
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <div style={row}>
              <label style={label} htmlFor="startTime">Start Time</label>
              <input id="startTime" name="startTime" type="time" value={form.startTime} onChange={handleChange} style={input} required />
            </div>
            <div style={row}>
              <label style={label} htmlFor="endTime">End Time</label>
              <input id="endTime" name="endTime" type="time" value={form.endTime} onChange={handleChange} style={input} required />
            </div>
          </div>

          <div style={row}>
            <label style={label} htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} style={input} required />
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "auto 1fr" }}>
            <label style={{ ...label, alignSelf: "center" }}>
              <input type="checkbox" name="RSVPNeeded" checked={form.RSVPNeeded} onChange={handleChange} /> RSVP Needed
            </label>
            <div style={row}>
              <label style={label} htmlFor="tags">Tags (comma separated)</label>
              <input id="tags" name="tags" placeholder="commuter, stem, sport" value={form.tags} onChange={handleChange} style={input} />
            </div>
          </div>


          <div style={row}>
            <ImageDragAndDrop onUploadedUrl={setImageUrl} />
          </div>

          <div style={actions}>
            <button type="submit" disabled={submitting} style={{ padding: "8px 14px", borderRadius: 8 }}>
              {submitting ? "Adding…" : "Add Event"}
            </button>
            <button type="button" onClick={() => navigate("/dashboard")} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd" }}>
              Cancel
            </button>
          </div>

          {msg && <p style={{ marginTop: 6, color: /✅/.test(msg) ? "lightgreen" : "salmon" }}>{msg}</p>}
        </form>
      </main>

      <Footer />
    </div>
  );
}
