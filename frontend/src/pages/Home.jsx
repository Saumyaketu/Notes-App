// src/pages/Home.jsx

import React, { lazy, Suspense } from 'react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../hooks/useAuth';

const AuthenticatedHome = lazy(() => import('./AuthenticatedHome'));
const UnauthenticatedLandingPage = lazy(() => import('./UnauthenticatedLandingPage'));

export default function Home() {
  const { token } = useAuth() || {};

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Header /> */}
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        {token? <AuthenticatedHome /> : <UnauthenticatedLandingPage />}
      </Suspense>
      {/* <Footer /> */}
    </div>
  );
}