import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';

export default function OauthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // read raw URL immediately
    const full = window.location.href;
    console.log('OauthCallback mounted, full URL:', full);

    // support both hash and query
    const hash = window.location.hash || '';
    const hashMatch = hash.match(/token=([^&]+)/);
    let token = hashMatch ? decodeURIComponent(hashMatch[1]) : null;

    if (!token) {
      const params = new URLSearchParams(window.location.search);
      token = params.get('token') ? decodeURIComponent(params.get('token')) : null;
    }

    if (!token) {
      console.warn('No token found in URL. URL:', full);
      // if component not mounted, do hard-reload to login page
      window.location.replace('/login');
      return;
    }

    console.log('Storing OAuth token (truncated):', token.slice(0, 30) + '...');
    localStorage.setItem('token', token);

    // attempt to fetch /me to populate user; ignore failure but store user on success
    fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const user = data.user ?? data;
        if (user) {
          console.log('Persisting user from /me:', user.email ?? user.id);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          console.warn('/me returned no user payload', data);
        }
      })
      .catch(err => console.warn('/me fetch failed', err))
      .finally(() => {
        // remove token from URL for cleanliness then navigate to dashboard
        try {
          history.replaceState(null, '', '/dashboard');
          // if you want React Router to handle it without reloading:
          navigate('/dashboard', { replace: true });
        } catch {
          window.location.replace('/dashboard');
        }
      });
  }, [navigate]);

  return <div>Signing you in…</div>;
}