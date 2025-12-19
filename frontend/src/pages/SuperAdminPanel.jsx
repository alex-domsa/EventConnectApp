// frontend/src/pages/SuperAdminPanel.jsx
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BACKEND_URL } from "../config";

function SuperAdminPanel() {
  const [email, setEmail] = useState("");
  const [clubId, setClubId] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("You must be logged in.");
        return;
      }

      const res = await fetch(
        `${BACKEND_URL}/api/admin/assign-club-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, clubId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Request failed");
      }

      setMessage(`✅ ${data.message}`);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-6 text-center">
          SuperAdmin Panel
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 space-y-4"
        >
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">User email</label>
            <input
              className="border rounded px-3 py-2 bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@mumail.ie"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Club ID</label>
            <input
              className="border rounded px-3 py-2 bg-background"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              placeholder="Paste club ObjectId here"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Make user admin of club
          </button>

          {message && (
            <p className="mt-2 text-sm whitespace-pre-wrap">{message}</p>
          )}
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default SuperAdminPanel;
