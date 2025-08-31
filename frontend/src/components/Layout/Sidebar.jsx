// src/components/Layout/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiPlus, FiHome, FiStar, FiArchive, FiSettings } from 'react-icons/fi';

const Item = ({ to, icon: Icon, children }) => (
  <NavLink to={to} className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors duration-200 ${isActive? 'bg-[var(--color-bg-sidebar-item-active)] text-[var(--color-text-sidebar-item-active)] font-medium' : 'text-text-primary text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sidebar-item-hover)] hover:text-[var(--color-text-sidebar-item-hover)]'}`}>
    <Icon className="text-lg" />
    <span>{children}</span>
  </NavLink>
);

export default function Sidebar(){
  return (
    <aside className="w-64 bg-card border-r p-4 hidden md:block bg-[var(--color-bg-card)] transition-colors duration-300">
      <div className="mb-6">
        <div className="text-xs text-muted mb-2">Quick</div>
        <Item to="/create" icon={FiPlus}>Create note</Item>
      </div>

      <nav className="space-y-1">
        <Item to="/" icon={FiHome}>Home</Item>
        <Item to="/starred" icon={FiStar}>Starred</Item>
        <Item to="/archive" icon={FiArchive}>Archive</Item>
        <Item to="/settings" icon={FiSettings}>Settings</Item>
      </nav>

      <div className="mt-6 text-xs text-muted">Tips: Press <span className="font-medium">N</span> to create note</div>
    </aside>
  );
}