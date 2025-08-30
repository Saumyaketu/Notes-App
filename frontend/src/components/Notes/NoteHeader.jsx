// src/components/Notes/NoteHeader.jsx
import React from 'react';
import { FiShare2, FiTrash2, FiArrowLeft, FiStar, FiArchive } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function NoteHeader({ note, title, setTitle, saving, onTogglePublic, onToggleStar, onToggleArchive, onDelete }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-semibold w-full bg-transparent border-b p-1"
          placeholder="Title"
        />
        <div className="text-sm text-muted">
          {saving ? "Saving…" : "Saved"}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onToggleStar}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={note?.isStarred ? 'Unstar' : 'Star'}
        >
          <FiStar className={note.isStarred ? 'text-yellow-500' : 'text-gray-500'} />
        </button>
        <button
          onClick={onToggleArchive}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={note?.isArchived ? 'Unarchive' : 'Archive'}
        >
          <FiArchive className={note.isArchived ? 'text-blue-500' : 'text-gray-500'} />
        </button>
        <button
          onClick={onTogglePublic}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={note?.isPublic ? 'Make Private' : 'Make Public'}
        >
          {note?.isPublic ? <FiShare2 className="text-yellow-500" /> : <FiShare2 className="text-blue-500" />}
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Delete Note"
        >
          <FiTrash2 className="text-red-500" />
        </button>
        <Link to="/" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Back to Notes">
          <FiArrowLeft />
        </Link>
      </div>
    </div>
  );
}