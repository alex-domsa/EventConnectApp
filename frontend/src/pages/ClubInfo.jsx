// frontend/src/pages/ClubInfo.jsx
import placeholder_image from "../assets/placeholder/placeholder_image.png";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Users,
  UserMinus,
} from "lucide-react";
import Navbar from "../components/Navbar";
import SquareHolder from "../components/SquareHolder";
import "../index.css";

import { BACKEND_URL } from "../config.js";

export default function ClubInfo() {
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  // ----- ADMIN PANEL STATE -----
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminList, setAdminList] = useState([]);

  const placeholderImage = placeholder_image;

  // Safely read user from localStorage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  // Super admin flag (from user.isSuperAdmin in DB)
  const isSuperAdmin = !!user?.isSuperAdmin;

  // ----- HELPERS -----
  const getImageSrc = (imagePath) =>
    imagePath && imagePath.trim() !== "" ? imagePath : placeholderImage;

  const getGalleryImages = () => {
    if (!club || !Array.isArray(club.gallery) || club.gallery.length <= 1) {
      return [placeholderImage, placeholderImage, placeholderImage];
    }
    return club.gallery.slice(0, 3).map((img) => getImageSrc(img));
  };

  const galleryImages = club
    ? getGalleryImages()
    : [placeholderImage, placeholderImage];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
    );
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setShowCopiedPopup(true);
      setTimeout(() => setShowCopiedPopup(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // (front-end only join/leave toggle for now)
  const handleJoinLeave = async () => {
    if (!id) return;
    setJoinError("");
    setJoinLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setJoinError("You must be signed in to join a club.");
        setJoinLoading(false);
        return;
      }

      const endpoint = `${BACKEND_URL}/api/clubs/${id}/${isJoined ? "leave" : "join"}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.message || body?.error || `Request failed (${res.status})`;
        setJoinError(msg);
        console.warn("Join/Leave error:", msg);
        setJoinLoading(false);
        return;
      }

      // Prefer server-provided updated user object when available
      const updatedUser = body?.user ?? body?.data ?? null;
      if (updatedUser) {
        try {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (e) { /* ignore localStorage failures */ }
      } else {
        // Fallback: locally add/remove club id from user.memberOf/adminOf arrays
        try {
          const localUser = JSON.parse(localStorage.getItem("user") || "null");
          if (localUser) {
            const memberSet = new Set([...(localUser.memberOf || []).map(String)]);
            if (isJoined) {
              memberSet.delete(String(id));
            } else {
              memberSet.add(String(id));
            }
            localUser.memberOf = Array.from(memberSet);
            localStorage.setItem("user", JSON.stringify(localUser));
          }
        } catch (e) { /* ignore */ }
      }

      // Toggle UI state
      setIsJoined((prev) => !prev);
    } catch (err) {
      console.error("Failed to join/leave club:", err);
      setJoinError("Network error, please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  // ----- ADMIN HELPERS -----

  // Reload current admins for this club
  const reloadAdmins = async () => {
    if (!isSuperAdmin || !id) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/api/clubs/${id}/admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.warn("Failed to load club admins", res.status);
        return;
      }

      const data = await res.json().catch(() => ({}));
      // controller returns { success, admins: [...] }
      setAdminList(data.admins || data.data || []);
    } catch (err) {
      console.error("Error fetching club admins:", err);
    }
  };

  // Assign club admin
  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    setAdminMessage("");

    if (!adminEmail.trim()) {
      setAdminMessage("Please enter an email.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAdminMessage("You must be logged in to assign admins.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/clubs/add-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userEmail: adminEmail.trim(), // 🔑 matches clubController.addAdminToClub
          clubId: id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to assign admin");
      }

      setAdminMessage(`✅ ${data.message || "Admin assigned"}`);
      setAdminEmail("");

      // refresh list
      await reloadAdmins();
    } catch (err) {
      console.error(err);
      setAdminMessage(`❌ ${err.message}`);
    }
  };

  // Remove club admin
  const handleRemoveAdmin = async (adminId) => {
    setAdminMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAdminMessage("You must be logged in to remove admins.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/clubs/remove-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: adminId,
          clubId: id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to remove admin");
      }

      setAdminMessage(`✅ ${data.message || "Admin removed"}`);

      // refresh list
      await reloadAdmins();
    } catch (err) {
      console.error(err);
      setAdminMessage(`❌ ${err.message}`);
    }
  };

  // ----- MAIN EFFECT: load club + events + admins -----
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/search/clubs/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch club (${res.status})`);
        const json = await res.json();
        setClub(json.data ?? json);
      } catch (err) {
        console.error("Error fetching club info:", err);
      }

      try {
        const clubEventsRes = await fetch(
          `${BACKEND_URL}/api/search/events/${id}`
        );
        if (!clubEventsRes.ok)
          throw new Error(`Failed to fetch events (${clubEventsRes.status})`);
        const clubEventsData = await clubEventsRes.json();
        setClubEvents(clubEventsData.data ?? clubEventsData);
      } catch (err) {
        console.error("Error fetching club events:", err);
      }

      // Initial joined state: just check local user membership arrays (simple)
      try {
        let localUser = null;
        try {
          localUser = JSON.parse(localStorage.getItem("user") || "null");
        } catch {
          localUser = null;
        }

        if (localUser) {
          const ids = new Set(
            [
              ...(localUser.memberOf || []),
              ...(localUser.clubIds || []),
              ...(localUser.clubs || []),
              ...(localUser.organisationIds || []),
              ...(localUser.organisations || []),
              ...(localUser.adminOf || []),
            ].map(String)
          );
          setIsJoined(ids.has(String(id)));
        } else {
          setIsJoined(false);
        }
      } catch (e) {
        console.warn("Error computing joined state", e);
        setIsJoined(false);
      }

      // Load admins if super admin
      await reloadAdmins();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isSuperAdmin]);

  // ----- RENDER -----
  return (
    <>
      <Navbar />
      {joinError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="rounded-md bg-red-50 text-red-700 p-3 mb-2">
            {joinError}
          </div>
        </div>
      )}

      {/* Copied to Clipboard Popup */}
      {showCopiedPopup && (
        <div className="fixed top-24 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          Copied to clipboard!
        </div>
      )}

      {club ? (
        <>
          {/* Hero Section */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative max-w-7xl mx-auto px-4 py-20 mt-16">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-6 mb-6">
                  <img
                    src={getImageSrc(club.logo)}
                    alt={`${club.name} logo`}
                    className="animate-float w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg bg-white"
                    onError={(e) => {
                      e.target.src = placeholderImage;
                    }}
                  />
                  <div>
                    <h1 className="text-5xl font-bold mb-2 drop-shadow-lg">
                      {club.name}
                    </h1>
                    <p className="text-xl text-white/90">
                      No of upcoming events: {clubEvents.length}
                    </p>
                  </div>
                </div>

                {/* Join / Share buttons */}
                <div className="flex flex-col gap-3">
                  {isJoined ? (
                    <button
                      onClick={handleJoinLeave}
                      type="button"
                      className="flex items-center justify-center gap-2 w-40 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                      disabled={joinLoading}
                    >
                      <UserMinus className="w-5 h-5" />
                      Leave Club
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinLeave}
                      type="button"
                      className="flex items-center justify-center gap-2 w-40 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                      disabled={joinLoading}
                    >
                      <Users className="w-5 h-5" />
                      Join Club
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    type="button"
                    className="flex items-center justify-center gap-2 w-40 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border-2 border-white/30"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* About + gallery */}
            <div className="grid md:grid-cols-2 gap-8 mb-12 -mt-4">
              {/* About */}
              <div className="bg-card rounded-xl shadow-lg border border-border p-8 relative z-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  About the club
                </h2>
                <p className="text-muted text-lg leading-relaxed">
                  {club.description}
                </p>
              </div>

              {/* Gallery */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 relative z-10">
                <div className="relative group">
                  <img
                    src={galleryImages[currentImageIndex]}
                    alt={`${club.name} gallery ${currentImageIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = placeholderImage;
                    }}
                  />

                  <button
                    onClick={prevImage}
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-4">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      type="button"
                      className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                        ? "bg-blue-600 w-8"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                        }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ADMIN PANEL */}
            {isSuperAdmin && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border 
                            border-gray-200 dark:border-gray-700 p-6 my-12
                            text-gray-900 dark:text-gray-100">

                {/* Title */}
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  Manage Club Admins
                </h2>

                {/* Sub heading */}
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Current Admins:
                </h3>

                {/* Admin list */}
                {adminList.length > 0 ? (
                  <ul className="mb-4">
                    {adminList.map((a) => (
                      <li
                        key={a._id}
                        className="flex justify-between items-center py-1 
                                text-gray-800 dark:text-gray-200"
                      >
                        <span>{a.email}</span>
                        <button
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 
                                    text-white rounded"
                          onClick={() => handleRemoveAdmin(a._id)}
                          disabled={a._id === user?._id}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No admins yet.</p>
                )}

                {/* Input + Button */}
                <form onSubmit={handleAssignAdmin} className="flex flex-col sm:flex-row gap-3 mt-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="border rounded px-3 py-2 w-full 
                            bg-white dark:bg-gray-800
                            text-gray-900 dark:text-gray-100
                            border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700
                            text-white px-4 py-2 rounded whitespace-nowrap"
                  >
                    Add Admin
                  </button>
                </form>

                {/* Result message */}
                {adminMessage && (
                  <p className="mt-2 text-sm text-gray-900 dark:text-gray-200">
                    {adminMessage}
                  </p>
                )}
              </div>
            )}


            {/* Divider */}
            <div className="relative mb-12">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t-2 border-gray-300 dark:border-gray-600 -mt-6"></div>
              </div>
            </div>

            {/* Events section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary">
                  Upcoming Events
                </h2>
                <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-semibold">
                  {clubEvents.length}{" "}
                  {clubEvents.length === 1 ? "Event" : "Events"}
                </span>
              </div>
              {clubEvents.length > 0 ? (
                <SquareHolder tasks={clubEvents} onTaskClick={null} />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No upcoming events at the moment
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading club information...</p>
          </div>
        </div>
      )}
    </>
  );
}
