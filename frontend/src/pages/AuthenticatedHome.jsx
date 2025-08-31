// src/pages/AuthenticatedHome.jsx

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../hooks/useAuth';
import { useNotes } from '../hooks/useNotes';
import NoteList from '../components/Notes/NoteList';
import { FiSearch } from 'react-icons/fi';

export default function AuthenticatedHome() {
  const { notes, loading, fetchNotes, createNote } = useNotes() || {};
  const { user } = useAuth() || {};
  const [q, setQ] = useState("");
  const location = useLocation();
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Determine filter from current path
    const path = location.pathname;
    let newFilter = 'all';
    let title = 'Home';
    
    if (path === '/starred') {
      newFilter = 'starred';
      title = 'Starred Notes';
    } else if (path === '/archive') {
      newFilter = 'archived';
      title = 'Archived Notes';
    }
    
    fetchNotes(q, newFilter);
    setCurrentPageTitle(title);
    setFilter(newFilter);
    document.title = title;
  }, [fetchNotes, q, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex bg-[var(--color-bg-primary)]">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{currentPageTitle}</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    fetchNotes(e.target.value, filter);
                  }}
                  placeholder="Search notes"
                  className="border rounded p-2 pl-10 bg-[var(--color-bg-input)]"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              </div>
              <button
                onClick={createNote}
                className="px-3 py-2 bg-[var(--color-accent-blue)] text-white rounded transition-transform transform hover:scale-105"
              >
                New
              </button>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">My Notes</h2>
            {loading? <div>Loading…</div> : <NoteList notes={notes} />}
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}