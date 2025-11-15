// src/pages/UnauthenticatedLandingPage.jsx

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function UnauthenticatedLandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCredentialResponse = async ({ credential }) => {
    const r = await login(credential);
    if (r === true) {
      navigate("/");
    } else {
      console.error('Google sign-in failed');
      // Optionally handle errors here
    }
  };

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-sign-in-button"),
        { theme: "outline", size: "large", type: "standard", text: "signup_with" }
      );
    }
  }, []);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full bg-card rounded-lg shadow p-8 bg-[var(--color-bg-card)]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3">Simple notes. Private by default.</h1>
            <p className="text-[var(--color-text-primary)] mb-6">
              Capture ideas, store docs, and share what you want with a single click. Works great for personal notes or small teams.
            </p>

            <div className="flex gap-3 items-center">
              <Link to="/register" className="px-4 py-2 bg-[var(--color-accent-green)] text-white rounded transition-transform transform hover:scale-105">Get started — it's free</Link>
              <div id="google-sign-in-button"></div>
            </div>
          </div>


          <div className="w-full md:w-1/3 p-4 rounded bg-[var(--color-bg-hover)]">
            <div className="text-sm text-muted mb-2">Preview</div>
            <div className="bg-[var(--color-bg-card)] rounded">
              <h3 className="font-medium text-sm mt-2">Meeting notes</h3>
              <p className="text-xs text-muted line-clamp-3 mt-2">- Roadmap review<br/>- Assign owners<br/>- Follow-ups</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}