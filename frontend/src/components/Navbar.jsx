// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { User, Heart, Plus, MapPin } from "lucide-react";


import { BACKEND_URL } from "../config.js";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const clubMenuRef = useRef(null);


  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");

  const navigate = useNavigate();

  // auth state
  const isToken = Boolean(localStorage.getItem("token"));
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }


  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const isClubAdmin = Boolean(user?.isAdmin);
  const canCreateEvents = isSuperAdmin || isClubAdmin;


  useEffect(() => {
    if (!isToken) return;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/search/clubs`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setClubs(data.data);
        }
      } catch (err) {
        console.error("Failed to load clubs:", err);
      }
    })();
  }, [isToken]);


  const handleClubSelect = (e) => {
    const id = e.target.value;
    setSelectedClub(id);
    if (id) navigate(`/clubs/${id}`);
  };

  return (
    <nav className="w-full shadow-sm bg-background/80 backdrop-blur-md border-b border-gray-200/40 dark:border-gray-700/30 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* THEME TOGGLE: pinned to very left (from dev) */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-40">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-card text-foreground">
              <ThemeToggle />
            </div>
          </div>

          {/* LEFT: Add Event (admin) */}
          <div className="flex items-center gap-3 pl-16">
            {canCreateEvents && (
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm bg-primary text-primary-foreground hover:opacity-95"

                onClick={() => navigate("/add")}
              >
                <Plus className="inline-block w-4 h-4 mr-2" />
                Add Event
              </button>
            )}
          </div>

          {/* CENTER: Brand */}
          <div className="flex-1 flex items-center justify-center">
            <a
              href="/dashboard"
              className="flex items-center space-x-3"
              aria-label="Event Connect Dashboard"
            >
              <span className="text-lg font-semibold tracking-wide text-foreground">
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Event Connect
                </span>
              </span>
            </a>
          </div>

          { }
          <div className="hidden sm:flex sm:items-center sm:space-x-6 navbar-right">
            { }
            {isToken && (
              <div className="relative" ref={clubMenuRef}>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={clubMenuOpen}
                  onClick={() => setClubMenuOpen((s) => !s)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setClubMenuOpen(true);
                    }
                    if (e.key === "Escape") setClubMenuOpen(false);
                  }}
                  className="inline-flex items-center text-sm font-medium px-3 py-1 rounded-md bg-card text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/25"
                  style={{ minWidth: 140 }}
                >
                  <span className="truncate mr-2">
                    {selectedClub
                      ? (clubs.find((c) => String(c._id) === String(selectedClub))?.name || "Clubs")
                      : "Clubs"}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${clubMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {clubMenuOpen && (
                  <div
                    role="listbox"
                    tabIndex={-1}
                    className="absolute right-0 w-56 max-h-64 overflow-auto rounded-md border border-border bg-primary text-primary-foreground shadow-lg z-50"
                    // place the dropdown directly below the button and add extra clearance
                    style={{ top: "100%", transform: "translateY(28px)" }}
                    onKeyDown={(e) => { if (e.key === "Escape") setClubMenuOpen(false); }}
                  >
                    <button
                      className="w-full text-left px-3 py-2 text-sm bg-transparent hover:bg-primary/90 focus:bg-primary/90"
                      onClick={() => { setSelectedClub(""); setClubMenuOpen(false); }}
                    >
                      All clubs
                    </button>
                    {clubs.map((club) => (
                      <button
                        key={club._id}
                        className="w-full text-left px-3 py-2 text-sm bg-transparent hover:bg-primary/90 focus:bg-primary/90"
                        onClick={() => {
                          setSelectedClub(String(club._id));
                          setClubMenuOpen(false);
                          navigate(`/clubs/${club._id}`);
                        }}
                      >
                        {club.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <a
              href="/map"
              className="flex items-center gap-2 text-muted hover:text-foreground"
            >
              <MapPin className="w-4 h-4" />{" "}
              <span className="text-sm">Map</span>
            </a>

            <a
              href="/favorites"
              className="flex items-center gap-2 text-muted hover:text-foreground"
            >
              <Heart className="w-4 h-4" />{" "}
              <span className="text-sm">Favorites</span>
            </a>

            {isToken ? (
              <a
                href="/profile"
                className="flex items-center gap-2 text-muted hover:text-foreground"
              >
                <User className="w-4 h-4" />{" "}
                <span className="text-sm">Profile</span>
              </a>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-2 text-muted hover:text-foreground"
              >
                <User className="w-4 h-4" />{" "}
                <span className="text-sm">Sign in</span>
              </a>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setOpen((s) => !s)}
              type="button"
              aria-expanded={open}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-card/50 focus:outline-none"
            >
              {open ? (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu (keeps dev style, adds canCreateEvents route) */}
        {open && (
          <div className="sm:hidden border-t border-gray-200/40 dark:border-gray-700/30 bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-card/50"
              >
                Home
              </a>
              <a
                href="/map"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-card/50"
              >
                Map
              </a>
              <a
                href="/favorites"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-card/50"
              >
                Favorites
              </a>
              {isToken ? (
                <a
                  href="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-card/50"
                >
                  My Profile
                </a>
              ) : (
                <a
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-card/50"
                >
                  Sign in
                </a>
              )}
              {canCreateEvents && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate("/events/new");
                  }}
                  className="block w-full text-center px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground hover:opacity-95"
                >
                  New Event
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
