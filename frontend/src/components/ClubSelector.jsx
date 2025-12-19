import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../config.js";

/*
  ClubSelector props:
  - value: currently selected club id (string)
  - onChange: fn(id) called when a club is selected
  - placeholder: optional placeholder text
*/
export default function ClubSelector({ value, onChange, placeholder = "Select organising club" }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/search/clubs`);
        const json = await res.json().catch(() => ({}));
        const items = (json.data && Array.isArray(json.data)) ? json.data : (json || []);
        if (!cancelled) setClubs(items);
      } catch (e) {
        console.warn("ClubSelector: failed to load clubs", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full max-w-md">
      <label className="sr-only">{placeholder}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        aria-label={placeholder}
        className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md border-border border focus:outline-none focus:ring-2 focus:ring-primary/25"
        // last-resort override: always white bg and black text
        style={{ backgroundColor: "#ffffff", color: "#000000" }}
      >
        <option value="">{loading ? "Loading clubs…" : "All clubs"}</option>
        {clubs.map((club) => (
          <option key={club._id} value={String(club._id)}>
            {club.name}
          </option>
        ))}
      </select>
    </div>
  );
}