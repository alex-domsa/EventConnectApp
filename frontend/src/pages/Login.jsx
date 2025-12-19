import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

import { BACKEND_URL } from "../config.js";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [welcome, setWelcome]   = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Login failed (HTTP ${res.status})`);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate('/dashboard');
      setWelcome(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (welcome) {
    return (
      <div className="campus-page">
        <div className="campus-card">
          <h1 className="title">Welcome back!</h1>
          <p className="muted">Signed in as <strong>{email}</strong></p>
          <button className="btn btn--neutral" onClick={() => setWelcome(false)}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-page">
      <div className="campus-card">
        <h1 className="title">Campus Connect</h1>
        <p className="muted">Enter your student credentials to access your account.</p>

        {error && <div className="alert">{error}</div>}

        <form className="form" onSubmit={handleLogin}>
          <label className="field">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              placeholder="name@college.ie"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <p className="fineprint">
          Don’t have an account? <Link className="link" to="/signup">Sign up</Link>
        </p>

        <button
          type="button"
          onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google`; }}
          className="btn-google"
          aria-label="Sign in with Google"
        >
          <span className="google-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2045c0-.638-.0573-1.2495-.1645-1.837H9v3.481h4.844c-.2094 1.13-.8464 2.09-1.8045 2.74v2.282h2.915c1.706-1.572 2.689-3.89 2.689-6.666z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-0.806 5.956-2.187l-2.915-2.282c-.806.54-1.84.86-3.041.86-2.338 0-4.32-1.578-5.025-3.694H.993v2.319C2.48 15.95 5.455 18 9 18z" fill="#34A853"/>
              <path d="M3.975 10.697c-.18-.54-.283-1.117-.283-1.697s.103-1.157.283-1.697V4.984H.993A8.995 8.995 0 000 9c0 1.48.356 2.88.993 4.016l2.982-2.319z" fill="#FBBC05"/>
              <path d="M9 3.579c1.32 0 2.506.454 3.44 1.345l2.578-2.578C13.462.986 11.425 0 9 0 5.455 0 2.48 2.05.993 4.984l2.982 2.319C4.68 5.157 6.662 3.579 9 3.579z" fill="#EA4335"/>
            </svg>
          </span>
          <span className="google-text">Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
