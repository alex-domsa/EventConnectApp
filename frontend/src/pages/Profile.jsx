import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { BACKEND_URL, FRONTEND_URL } from "../config.js";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [clubsLoading, setClubsLoading] = useState(false);
    const [favEvents, setFavEvents] = useState([]);
    const [favLoading, setFavLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const ac = new AbortController();

        // 1) Try localStorage first (Login stores "user")
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch { }
            setLoading(false);
            return () => ac.abort();
        }

        // 2) Fallback: call backend /api/auth/me with Bearer token
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return () => ac.abort();
        }

        (async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    signal: ac.signal
                });

                if (!res.ok) {
                    // Unauthorized -> clear token and user
                    if (res.status === 401) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setUser(null);
                        setError("Not authenticated");
                        return;
                    }
                    throw new Error(`Fetch failed (${res.status})`);
                }

                const data = await res.json();
                const u = data.user ?? data;
                setUser(u);
                try { localStorage.setItem("user", JSON.stringify(u)); } catch { }
                setError(null);
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message || "Fetch error");
            } finally {
                setLoading(false);
            }
        })();

        return () => ac.abort();
    }, []);

    // Fetch full club objects for any club IDs in the user doc
    useEffect(() => {
        if (!user) return;
        const ids = new Set([
            ...(user.memberOf || []),
            ...(user.clubIds || []),
            ...(user.clubs || []),
            ...(user.organisationIds || []),
            ...(user.organisations || [])
        ].map(String));

        const idsArr = Array.from(ids).filter(Boolean);
        if (idsArr.length === 0) {
            setClubs([]);
            return;
        }

        let cancelled = false;
        setClubsLoading(true);
        (async () => {
            try {
                const fetches = idsArr.map(id =>
                    fetch(`${BACKEND_URL}/api/search/clubs/${id}`).then(r => {
                        if (!r.ok) return null;
                        return r.json().then(j => j.data ?? j).catch(() => null);
                    }).catch(() => null)
                );
                const results = await Promise.all(fetches);
                if (cancelled) return;
                const found = results.filter(Boolean);
                setClubs(found);
            } catch (e) {
                console.warn('Failed to load member clubs', e);
                setClubs([]);
            } finally {
                if (!cancelled) setClubsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user]);

    // load favorited event objects for display
    useEffect(() => {
        if (!user) { setFavEvents([]); return; }
        const ids = (user.favoritedEvents ?? user.favorited ?? []).map(String).filter(Boolean);
        if (ids.length === 0) { setFavEvents([]); return; }
        let cancelled = false;
        setFavLoading(true);
        (async () => {
            try {
                const fetches = ids.map(id =>
                    fetch(`${BACKEND_URL}/api/data/${id}`).then(r => {
                        if (!r.ok) return null;
                        return r.json().then(j => j.data ?? j).catch(() => null);
                    }).catch(() => null)
                );
                const results = await Promise.all(fetches);
                if (cancelled) return;
                setFavEvents(results.filter(Boolean));
            } catch (e) {
                console.warn('Failed to load favorite events', e);
                if (!cancelled) setFavEvents([]);
            } finally {
                if (!cancelled) setFavLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user]);

    const handleSignOut = async () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        fetch(`${BACKEND_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => { });
        navigate("/dashboard", { replace: true });
    };

    const name = user?.displayName ?? user?.name ?? "Unknown User";
    const email = user?.email ?? "No email";
    const photo = user?.photoURL ?? null;
    const isAdmin = Boolean(
        user?.isAdmin ||
        user?.admin ||
        user?.role === "admin" ||
        (Array.isArray(user?.roles) && user.roles.includes("admin"))
    );

    return (
        // page-level flex layout so Footer sits at bottom
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <Navbar />

            {/* main grows to push footer down */}
            <main className="flex-1 max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-semibold mb-4">Profile</h1>

                {loading ? (
                    <div className="bg-card rounded-lg shadow-sm p-4 mb-4">Loading...</div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 rounded-lg shadow-sm p-4 mb-4">
                        Error loading profile: {error}
                    </div>
                ) : (
                    <>
                        <section className="bg-card rounded-lg shadow-sm p-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-card overflow-hidden flex items-center justify-center text-2xl text-foreground">
                                    {photo ? (
                                        <img src={photo} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        (name || "U").slice(0, 1).toUpperCase()
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="text-lg font-semibold">{name}</div>
                                    <div className="text-sm text-muted">{email}</div>
                                </div>

                                <div>
                                    <button
                                        onClick={handleSignOut}
                                        className="px-3 py-2 rounded-md border border-border bg-card text-sm hover:opacity-95"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="bg-card rounded-lg shadow-sm p-4 mb-4">
                            <h2 className="text-lg font-medium mb-2">Favorites</h2>
                            {favLoading ? (
                                <div className="text-muted">Loading favorites…</div>
                            ) : favEvents.length === 0 ? (
                                <div className="text-muted">No favorites yet.</div>
                            ) : (
                                <div className="grid gap-3">
                                    {favEvents.map(ev => (
                                        <Link key={ev._id || ev.id} to={`/events/${ev._id || ev.id}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 border">
                                            <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                                                {ev.club?.logo || ev.club?.image || ev.logo ? (
                                                    <img src={ev.club?.logo || ev.club?.image || ev.logo} alt={ev.club?.name || ev.eventName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm text-gray-600">{(ev.eventName || '').slice(0, 1).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{ev.eventName || ev.title || 'Untitled Event'}</div>
                                                <div className="text-sm text-gray-500">{ev.date ?? ev.start ?? ''} {ev.startTime ? ` • ${ev.startTime}` : ''}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="bg-card rounded-lg shadow-sm p-4 mb-4">
                            <h2 className="text-lg font-medium mb-2">Clubs</h2>

                            {clubsLoading ? (
                                <div className="text-muted">Loading clubs…</div>
                            ) : clubs.length > 0 ? (
                                <div className="grid gap-3">
                                    {clubs.map((c) => (
                                        <Link key={c._id || c.id} to={`/clubs/${c._id || c.id}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 border">
                                            <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                                                {c.logo ? (
                                                    <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm text-gray-600">{(c.name || '').slice(0, 1).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{c.name || c.title || 'Unnamed Club'}</div>
                                                <div className="text-sm text-gray-500">{c.shortDescription || c.description?.slice?.(0, 80)}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500">No clubs yet.</div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
