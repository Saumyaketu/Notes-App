// src/components/Auth/RegisterForm.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleCredentialResponse = async ({ credential }) => {
    const r = await login(credential);
    if (r === true) {
      navigate("/");
    } else {
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
    }
  };

  useEffect(() => {
    // Check if the Google script is loaded
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-sign-up-button"),
        { theme: "outline", size: "large", type: "standard", text: "signup_with" }
      );
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const r = await register(name, email, password);
    if (r === true) {
      navigate("/");
    } else {
      setHasError(true);
      setTimeout(() => setHasError(false), 500);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`max-w-md mx-auto bg-card p-6 rounded shadow bg-[var(--color-bg-card)] ${hasError? 'animate-shake' : ''}`}
    >
      <h2 className="text-2xl mb-4 text-[var(--color-text-primary)]">Create account</h2>
      <label className="block mb-2 text-[var(--color-text-primary)]">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border rounded p-2 bg-[var(--color-bg-input)]"
        />
      </label>
      <label className="block mb-2 text-[var(--color-text-primary)]">
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border rounded p-2 bg-[var(--color-bg-input)]"
        />
      </label>
      <label className="block mb-4 text-[var(--color-text-primary)]">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border rounded p-2 bg-[var(--color-bg-input)]"
        />
      </label>
      <div className="flex justify-between items-center">
        <button className="bg-[var(--color-accent-green)] text-white px-4 py-2 rounded transition-transform transform hover:scale-105">
          Register
        </button>
        <a className="text-sm text-[var(--color-text-link)]" href="/login">
          Sign in
        </a>
      </div>
      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      <div id="google-sign-up-button" className="mx-auto"></div>
    </form>
  );
}