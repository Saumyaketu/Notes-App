// src/components/Notes/NoteCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { FiStar, FiArchive, FiTrash2 } from 'react-icons/fi';
import { useNotes } from '../../hooks/useNotes';
import { useAuth } from '../../hooks/useAuth';
import * as notesService from '../../services/notesService';

const NoteCard = React.memo(({ note = {} }) => {
  const { token } = useAuth();
  const { fetchNotes } = useNotes();
  if (!note) return null;

  const title = note.title || 'Untitled';
  const content = note.content || '';
  const tags = Array.isArray(note.tags)? note.tags : [];

  const handleToggleStar = async (e) => {
    e.preventDefault();
    if (!token) return;
    await notesService.updateNote(token, note._id, { isStarred: !note.isStarred });
    fetchNotes();
  };
  
  const handleToggleArchive = async (e) => {
    e.preventDefault();
    if (!token) return;
    await notesService.updateNote(token, note._id, { isArchived: !note.isArchived });
    fetchNotes();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    if (!token) return;
    await notesService.deleteNote(token, note._id);
    fetchNotes();
  };

  return (
    <article
      className={clsx(
        'bg-card rounded-2xl shadow-soft p-4 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 hover:scale-[1.01]',
        'border border-transparent hover:border-border-card',
        'bg-[var(--color-bg-card)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-lg truncate">{title}</h3>
        {note.isPublic && (
          <div className="text-xs text-note-badge-text bg-note-badge-bg px-2 py-1 rounded">
            Public
          </div>
        )}
      </div>

      <p className="text-sm text-muted mt-3 line-clamp-4">{content}</p>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2 items-center">
          {tags.slice(0, 3).map((t, i) => (
            <span
              key={t?? `tag-${i}`}
              className="text-xs bg-gray-100 dark:bg-white/5 px-2 py-1 rounded"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={handleToggleStar} title="Star/Unstar" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <FiStar className={note.isStarred ? 'text-yellow-500' : 'text-gray-500'} />
          </button>
          <button onClick={handleToggleArchive} title="Archive/Unarchive" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <FiArchive className={note.isArchived ? 'text-blue-500' : 'text-gray-500'} />
          </button>
          <button onClick={handleDelete} title="Delete" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <FiTrash2 className="text-red-500" />
          </button>
          <Link to={`/notes/${note._id}`} className="text-sm text-link hover:underline">
            Open →
          </Link>
        </div>
      </div>
    </article>
  );
});

export default NoteCard;