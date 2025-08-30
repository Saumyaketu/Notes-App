import React, { createContext, useState, useEffect, useCallback } from "react";
import * as notesService from "../services/notesService";
import { useAuth } from "../hooks/useAuth";

export const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(
    async (q = "", filter = 'all') => {
      if (!token) return;
      setLoading(true);
      const res = await notesService.getNotes(token, q, filter);
      setNotes(res.notes || []);
      setLoading(false);
    },
    [token]
  );

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async () => {
    if (!token) return;
    const res = await notesService.createNote(token, {
      title: "Untitled",
      content: "",
    });
    if (res._id) setNotes((n) => [res, ...n]);
    return res;
  };

  const value = { notes, loading, fetchNotes, createNote, setNotes };
  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
