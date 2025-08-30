// src/routes/AppRoutes.jsx

import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import RequireAuth from "./RequireAuth";

// Lazy load route-level components
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Home = lazy(() => import("../pages/Home"));
const NoteDetail = lazy(() => import("../pages/NoteDetail"));
const PublicNote = lazy(() => import("../pages/PublicNote"));
const NotFound = lazy(() => import("../pages/NotFound"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/s/:shareId" element={<PublicNote />} />
        <Route path="*" element={<NotFound />} />
        
        {/* Protected Routes */}
        <Route
          path="/notes/:id"
          element={
            <RequireAuth>
              <NoteDetail />
            </RequireAuth>
          }
        />
      </Routes>
    </Suspense>
  );
}