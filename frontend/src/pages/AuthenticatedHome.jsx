// src/pages/AuthenticatedHome.jsx

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
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

  useEffect(() => {
    // Determine filter from current path
    const path = location.pathname;
    let filter = 'all';
    let title = 'All Notes';
    
    if (path === '/starred') {
      filter = 'starred';
      title = 'Starred Notes';
    } else if (path === '/archive') {
      filter = 'archived';
      title = 'Archived Notes';
    }
    
    setCurrentPageTitle(title);
    fetchNotes(q, filter);
  }, [fetchNotes, q, location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
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
                  fetchNotes(e.target.value);
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
  );
}