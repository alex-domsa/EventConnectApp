// frontend/src/pages/EventDetails.jsx
import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useParams, useNavigate, Link } from "react-router-dom";
// intentionally not importing local CSS to avoid layout poisoning
import { BACKEND_URL } from "../config.js";

import ImageHolder from "../components/imageHolder";
import TagPill from "../components/TagPill";
import Footer from "../components/Footer.jsx";
import parseDay from "../utils/dayParser.js";
import parseTime from "../utils/timeParser.js";
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Trash2,
} from "lucide-react";

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

const pretty = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") {
    if (v.startsWith("http://") || v.startsWith("https://"))
      return (
        <a
          className="text-indigo-600 hover:underline"
          href={v}
          target="_blank"
          rel="noreferrer"
        >
          {v}
        </a>
      );
    return v;
  }
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
};

// derive usable image src from common DB shapes
function getImageSrc(val) {
  if (!val) return null;

  const isFullUrl = (s) =>
    typeof s === "string" && (s.startsWith("http://") || s.startsWith("https://"));

  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;
    // only accept absolute URLs — treat tokens like "ADD LATER" or relative names as missing
    if (isFullUrl(s)) return s;
    return null;
  }

  if (typeof val === "object") {
    if (typeof val.url === "string" && isFullUrl(val.url)) return val.url;
    if (typeof val.src === "string" && isFullUrl(val.src)) return val.src;
    if (val.filename) {
      const candidate = `${BACKEND_URL}/${val.filename}`;
      if (isFullUrl(candidate)) return candidate;
    }
    if (val.path) {
      const candidate = `${BACKEND_URL}/${val.path}`;
      if (isFullUrl(candidate)) return candidate;
    }
    return null;
  }

  return null;
}

// ----- duration helpers ------------------------------------------------
function parseTimeToDate(timeOrIso, fallbackDate) {
  // timeOrIso can be "14:30:00", "14:30", or a full ISO date string
  if (!timeOrIso) return null;
  const m = String(timeOrIso)
    .trim()
    .match(/^([01]?\d|2[0-3]):([0-5]?\d)(?::([0-5]?\d))?$/);
  if (m) {
    let d = fallbackDate ? new Date(fallbackDate) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    d.setHours(
      parseInt(m[1], 10),
      parseInt(m[2], 10),
      m[3] ? parseInt(m[3], 10) : 0,
      0
    );
    return d;
  }
  const iso = new Date(timeOrIso);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

function formatDuration(ms) {
  if (ms == null || ms <= 0) return null;
  let secs = Math.floor(ms / 1000);
  const days = Math.floor(secs / 86400);
  secs -= days * 86400;
  const hours = Math.floor(secs / 3600);
  secs -= hours * 3600;
  const minutes = Math.floor(secs / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (parts.length === 0) return "<1m";
  return parts.join(" ");
}
// ----- end duration helpers --------------------------------------------

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  // ⭐ initialise from localStorage, then refine with /auth/me
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [isFavorited, setIsFavorited] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ⭐ Fetch event by ID (new /api/data/:id endpoint)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/data/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const payload = await res.json().catch(() => ({}));
        const fullEvent = payload.data ?? payload;
        setEvent(fullEvent || null);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Could not load event.");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ⭐ Ensure club object is populated when event only contains a club id (dev behaviour)
  useEffect(() => {
    if (!event) return;
    const possibleId =
      (event.club && typeof event.club === "string" && event.club) ||
      event.clubId ||
      event.societyId ||
      event.organiserId ||
      event.hostId ||
      (event.club && (event.club.$oid || event.club["$oid"]));

    if (
      event.club &&
      typeof event.club === "object" &&
      (event.club.name || event.club.logo || event.club.image)
    )
      return;
    if (!possibleId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/search/clubs/${possibleId}`
        );
        if (!res.ok) return;
        const payload = await res.json().catch(() => ({}));
        const club = payload.data ?? payload;
        if (club && !cancelled) {
          setEvent((prev) => (prev ? { ...prev, club } : prev));
        }
      } catch (e) {
        console.warn("Failed to fetch club for event:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [event]);

  // ⭐ Load current user via JWT /auth/me (dev behaviour)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          console.warn("Failed to fetch /me", res.status);
          return;
        }
        const json = await res.json().catch(() => ({}));
        const u = json.user ?? json;
        if (!cancelled) {
          setUser(u);
          try {
            localStorage.setItem("user", JSON.stringify(u));
          } catch { }
        }
      } catch (e) {
        console.warn("Error fetching /me", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ⭐ sync initial favourite state
  useEffect(() => {
    if (!user || !event) {
      setIsFavorited(false);
      return;
    }
    const favs = user.favoritedEvents ?? user.favorited ?? [];
    const eventId = String(event._id ?? event.id ?? id);
    setIsFavorited(
      Array.isArray(favs) && favs.some((f) => String(f) === eventId)
    );
  }, [user, event, id]);

  // ⭐ toggle favourite (dev behaviour)
  async function toggleFavorite() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const eventId = event._id || event.id || id;
    const willAdd = !isFavorited;
    setIsFavorited(willAdd);

    try {
      let res = await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, action: willAdd ? "add" : "remove" }),
      });

      if (!res.ok) {
        res = await fetch(`${BACKEND_URL}/api/users/favorites`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            eventId,
            action: willAdd ? "add" : "remove",
          }),
        });
        if (!res.ok) throw new Error("Failed to update favorites");
      }

      setUser((prev) => {
        if (!prev) return prev;
        const prevFavs = Array.isArray(prev.favoritedEvents)
          ? [...prev.favoritedEvents]
          : [];
        const idx = prevFavs.findIndex(
          (f) => String(f) === String(eventId)
        );
        if (willAdd) {
          if (idx === -1) prevFavs.push(eventId);
        } else {
          if (idx !== -1) prevFavs.splice(idx, 1);
        }
        const updated = { ...prev, favoritedEvents: prevFavs };
        try {
          localStorage.setItem("user", JSON.stringify(updated));
        } catch { }
        return updated;
      });
    } catch (e) {
      console.warn("Failed to toggle favorite:", e);
      setIsFavorited(!willAdd);
    }
  }

  // ⭐ UPDATED ROLE LOGIC: super admin OR club admin for this club
  const canEdit = useMemo(() => {
    if (!user || !event) return false;

    const isSuperAdmin = !!user.isSuperAdmin;
    if (isSuperAdmin) return true;

    const isClubAdmin = !!user.isAdmin;
    if (!isClubAdmin || !Array.isArray(user.adminOf)) return false;

    const eventClubId = (
      event.clubId ||
      event.club?._id ||
      event.organiserId ||
      event.hostId ||
      ""
    ).toString();

    return user.adminOf.some((id) => id.toString() === eventClubId);
  }, [user, event]);

  // ----- image selection (dev behaviour) --------------------------------
  const singleImage =
    (event &&
      (event.imageUrl ||
        event.image ||
        event.img ||
        event.photo ||
        event.image_url ||
        event.imageURL ||
        event.poster)) ||
    null;

  const gallery = event
    ? Array.isArray(event.images) && event.images.length
      ? event.images
      : Array.isArray(event.photos) && event.photos.length
        ? event.photos
        : Array.isArray(event.gallery) && event.gallery.length
          ? event.gallery
          : event.imageArray || []
    : [];

  const firstImage = gallery.length ? gallery[0] : singleImage;
  useEffect(() => {
    setCurrentImage(firstImage || null);
  }, [firstImage]);

  // ----- early loading/error states ------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center pt-24">
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center pt-24">
          <p>{error || "Event not found."}</p>
        </div>
      </div>
    );
  }

  // ----- derived fields once event exists -------------------------------
  const clubId =
    event.club?._id ||
    event.clubId ||
    event.societyId ||
    event.organiser?.id ||
    event.organiserId ||
    event.host?.id ||
    event.hostId ||
    (event.club && (event.club["$oid"] || event.club)) ||
    null;

  const clubName =
    event.club?.name ||
    event.society ||
    event.organiser?.name ||
    event.host?.name ||
    event.clubName ||
    "Unknown Club";

  // Use getImageSrc so non-URL tokens (like "ADD LATER" or plain names) return null.
  // ImageHolder will render the placeholder when null or when the URL 404s.
  const clubLogoSrc =
    getImageSrc(
      (event.club && (event.club.logo || event.club.image || event.club.photo)) ||
      (event.organiser && (event.organiser.logo || event.organiser.image))
    ) || null;

  const shownKeys = new Set([
    "_id",
    "eventName",
    "date",
    "start",
    "end",
    "startTime",
    "endTime",
    "location",
    "venue",
    "description",
    "RSVPNeeded",
    "muLifeLink",
    "imageUrl",
    "image",
    "img",
    "photo",
    "poster",
    "images",
    "photos",
    "gallery",
    "tags",
    "category",
    "type",
    "capacity",
    "maxAttendees",
    "attendees",
    "registered",
    "club",
    "clubId",
    "societyId",
    "organiser",
    "host",
    "clubName",
    "contactEmail",
    "contactPhone",
    "tagline",
    "subtitle",
    "cost",
    "price",
  ]);

  const otherData = Object.fromEntries(
    Object.entries(event)
      .filter(([k]) => !shownKeys.has(k))
      .map(([k, v]) => [k, v])
  );

  const imageSrc = getImageSrc(currentImage || singleImage);

  const dateSource = event?.date || event?.start || null;
  const dayName = dateSource ? parseDay(dateSource) : null;
  const dateDisplay =
    dateSource === null
      ? "—"
      : dayName
        ? `${dayName}, ${typeof dateSource === "string"
          ? dateSource
          : formatDate(dateSource)
        }`
        : typeof dateSource === "string"
          ? dateSource
          : formatDate(dateSource);

  const computedDuration = (() => {
    try {
      const startCandidate = event.startTime || event.start;
      const endCandidate = event.endTime || event.end;
      if (!startCandidate || !endCandidate) return null;
      const startDate = parseTimeToDate(
        startCandidate,
        event.date || event.start
      );
      const endDate = parseTimeToDate(
        endCandidate,
        event.date || event.start
      );
      if (!startDate || !endDate) return null;
      let diff = endDate - startDate;
      if (diff < 0 && Math.abs(diff) < 24 * 3600 * 1000) {
        diff += 24 * 3600 * 1000;
      }
      return diff > 0 ? formatDuration(diff) : null;
    } catch {
      return null;
    }
  })();

  return (
    // make page a column flex layout so footer is pushed to the bottom
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      <Navbar />

      {/* make main expand to fill available space so footer sits at page bottom */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* header with back + id */}
        <div className="mb-6 relative">
          <div className="absolute left-0 top-0">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:underline"
            >
              ← Back
            </button>
          </div>

          <div className="absolute right-0 top-0 text-right">
            <span className="text-xs text-gray-500 mr-2">ID:</span>
            <span className="text-xs text-muted-foreground">
              {String(event._id || event.id || "")}
            </span>
          </div>
        </div>

        <article className="mx-auto w-full max-w-5xl text-left bg-card/80 backdrop-blur-md rounded-lg shadow-lg p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
          {/* Visual / gallery column */}
          <aside className="col-span-1 lg:col-span-1">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border-4 border-gray-200/40 dark:border-gray-700/40 p-1">
              <div className="rounded-md overflow-hidden">
                <ImageHolder
                  src={imageSrc}
                  alt={event.eventName || "Event image"}
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>

            {gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {gallery.map((src, i) => {
                  const thumb =
                    getImageSrc(src) || (typeof src === "string" ? src : null);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentImage(src)}
                      className="rounded overflow-hidden border-2 border-transparent hover:border-primary transition"
                    >
                      <ImageHolder
                        src={thumb}
                        alt={`${event.eventName} ${i + 1}`}
                        className="w-full h-16 object-cover"
                        size={64}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Main information column */}
          <div className="col-span-1 lg:col-span-3">
            <header className="mb-6 relative">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-200/40 z-0" />
              <h1 className="relative inline-block text-4xl font-extrabold leading-tight px-3 z-10 bg-background/90">
                {event.eventName || "Untitled Event"}
              </h1>
              {event.tagline && (
                <p className="mt-2 text-lg text-muted-foreground">
                  {event.tagline}
                </p>
              )}
            </header>

            <div className="mb-6 flex items-center justify-between">
              <div className="mt-3 bg-primary/10 inline-block px-10 py-1 rounded-full border border-primary/30">
                {clubName ? (
                  clubId ? (
                    <Link
                      to={`/clubs/${clubId}`}
                      className="inline-flex items-center gap-3 px-2 py-1 rounded-full bg-card hover:shadow-sm"
                    >
                      <ImageHolder
                        src={clubLogoSrc}
                        alt={clubName}
                        size={32}
                        className="rounded-md overflow-hidden"
                      />
                      <span className="text-lg font-semibold text-indigo-600 hover:underline">
                        {clubName}
                      </span>
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-3 px-2 py-1 rounded-full bg-card border border-border">
                      <ImageHolder
                        src={clubLogoSrc}
                        alt={clubName}
                        size={32}
                        className="rounded-md overflow-hidden"
                      />
                      <div className="text-lg font-semibold">
                        {clubName}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-base">
                    {event.organiser || event.host || "—"}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  aria-pressed={isFavorited}
                  title={
                    isFavorited
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full transition ${isFavorited
                    ? "bg-yellow-400 text-white"
                    : "bg-transparent border border-gray-200 text-gray-700"
                    }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isFavorited ? "text-white" : "text-gray-700"
                      }`}
                  />
                  <span className="text-sm">
                    {isFavorited ? "Saved" : "Save"}
                  </span>
                </button>

                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/edit/${event._id}`)}
                      className="ml-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    >
                      Edit event
                    </button>

                    {/* Delete button - visible to club admins / super admins (same condition as Edit) */}
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      className="ml-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 inline-flex items-center gap-2"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Date */}
              <div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                </div>
                <div className="text-lg font-medium">{dateDisplay}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {dayName
                    ? typeof dateSource === "string"
                      ? dateSource
                      : formatDate(dateSource)
                    : dateSource
                      ? String(dateSource)
                      : "—"}
                </div>
              </div>

              {/* Time */}
              <div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                </div>
                <div className="text-lg font-medium">
                  {event.startTime || event.start
                    ? `${parseTime(event.startTime || event.start) ||
                    event.startTime ||
                    formatDate(event.start)
                    }${event.endTime
                      ? ` — ${parseTime(event.endTime) || event.endTime
                      }`
                      : event.end
                        ? ` — ${formatDate(event.end)}`
                        : ""
                    }`
                    : "—"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {computedDuration
                    ? `Duration: ${computedDuration}`
                    : event.startTime || event.start
                      ? event.endTime || event.end
                        ? "Duration unavailable"
                        : ""
                      : ""}
                </div>
              </div>

              {/* Where */}
              <div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Where</span>
                </div>
                <div className="text-lg font-medium">
                  {event.location || event.venue || "—"}
                </div>
                {event.building && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {event.building}
                  </div>
                )}
              </div>
            </section>

            {/* Tags */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {Array.isArray(event.tags) &&
                  event.tags.map((t, i) => <TagPill key={i} tag={t} />)}
              </div>
            </div>

            {/* Description */}
            <section className="mb-6">
              <h3 className="text-sm text-gray-500 mb-2">Description</h3>
              <div className="prose max-w-none text-base text-foreground whitespace-pre-wrap">
                {event.description || "No description provided."}
              </div>
            </section>

            {/* RSVP / MU Life link */}
            <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mt-1">
                  RSVP: {event.RSVPNeeded ? "Yes" : "No"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">MuLife Link</div>
                <div className="text-base">
                  {event.muLifeLink ? (
                    <a
                      className="text-indigo-600 hover:underline"
                      href={event.muLifeLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on MU Life
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </section>

            {/* Other data */}
            {Object.keys(otherData).length > 0 && (
              <section className="mt-4 border-t pt-4 text-sm text-gray-600">
                <h4 className="text-xs text-gray-500 mb-2">Other data</h4>
                <div className="space-y-3">
                  {Object.entries(otherData).map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-4 gap-3 items-start"
                    >
                      <div className="text-xs text-gray-500">{k}</div>
                      <pre className="col-span-3 bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                        {pretty(v)}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>
      <Footer />

      {/* Confirmation modal (simple inline, theme aware via tailwind) */}
      {showConfirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* lighter backdrop blur and slightly less dark overlay */}
          <div
            className="fixed inset-0 bg-black/30"
            style={{ backdropFilter: "blur(2px)" }}
            onClick={() => setShowConfirmDelete(false)}
          />
          {/* float-up animation + primary background for a purple card look */}
          <div className="relative max-w-md w-full mx-4 bg-primary text-primary-foreground border border-border rounded-lg p-6 shadow-lg z-10 animate-float-up">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Confirm delete</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-2 rounded-md bg-transparent border border-border text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const token = localStorage.getItem("token");
                    const eventId = event._id || event.id || id;
                    const res = await fetch(`${BACKEND_URL}/api/data/${eventId}`, {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                    });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      throw new Error(body?.message || `Delete failed (${res.status})`);
                    }
                    // navigate away after delete
                    navigate("/dashboard");
                  } catch (err) {
                    console.error("Failed to delete event:", err);
                    // show user friendly notice in-page
                    setError(err.message || "Failed to delete event.");
                    setShowConfirmDelete(false);
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 flex items-center gap-2"
                disabled={deleting}
              >
                {deleting ? "Deleting…" : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetails;
