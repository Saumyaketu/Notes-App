// src/pages/NoteDetail.jsx

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/Layout/Header";
import NoteEditor from "../components/Notes/NoteEditor";
import ShareModal from "../components/Notes/ShareModal";
import * as notesService from "../services/notesService";
import { useAuth } from "../hooks/useAuth";
import useDebounce from "../hooks/useDebounce";
import toast from 'react-hot-toast';
import NoteHeader from "../components/Notes/NoteHeader";

export default function NoteDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  //Enhance State Management for User Experience in future
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState("");


  async function handleSaveNote({ title: newTitle, content: newContent }) {
    try {
      // if you already have note id => update, otherwise create
      if (id) {
        // your notesService.updateNote signature earlier is (token, id, patch)
        await notesService.updateNote(token, id, { title: newTitle, content: newContent });
        setTitle(newTitle);
        setContent(newContent);
        return true;
      } else {
        // if creating a new note (no id yet)
        const created = await notesService.createNote(token, { title: newTitle, content: newContent });
        // if your createNote returns created note with id, you might want to navigate to it:
        if (created && created._id) {
          navigate(`/notes/${created._id}`);
        }
        return true;
      }
    } catch (err) {
      console.error('save note failed', err);
      throw err;
    }
  }


  useEffect(() => {
    let mounted = true;
    notesService.getNote(token, id).then((r) => {
      if (!mounted) return;
      if (r._id) {
        setNote(r);
        setTitle(r.title || "");
        setContent(r.content || "");
        if (r.isPublic && r.shareId)
          setShareUrl(`${window.location.origin}/s/${r.shareId}`);
      } else {
        alert(r.error || "Not found");
        navigate("/");
      }
    });
    return () => (mounted = false);
  }, [id, token]);

  useDebounce(
    async () => {
      if (!note) return;
      setSaving(true);
      const res = await notesService.updateNote(token, id, { title, content });
      setSaving(false);
      if (res.error) console.error(res.error);
    },
    1500,
    [title, content]
  );

  const remove = async () => {
    if (!confirm("Delete?")) return;
    await notesService.deleteNote(token, id);
    navigate("/");
  };
  
  const handleToggleStar = async () => {
    const res = await notesService.updateNote(token, id, { isStarred: !note.isStarred });
    if (!res.error) {
        setNote((v) => ({ ...v, isStarred: !v.isStarred }));
    }
  };

  const handleToggleArchive = async () => {
    const res = await notesService.updateNote(token, id, { isArchived: !note.isArchived });
    if (!res.error) {
        setNote((v) => ({ ...v, isArchived: !v.isArchived }));
    }
  };


  const togglePublic = async () => {
    const res = await notesService.updateNote(token, id, {
      isPublic: !note.isPublic,
    });
    if (!res.error) {
      setNote((v) => ({
      ...v,
        isPublic:!v.isPublic,
        shareId: res.shareId || v.shareId,
      }));
      if (!note.isPublic && res.shareId)
        setShareUrl(`${window.location.origin}/s/${res.shareId}`);
      if (note.isPublic) setShareUrl("");
    }
  };

  const createShare = async () => {
    const res = await notesService.createShare(token, id);
    if (res.shareUrl) setShareUrl(res.shareUrl);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Header />
      <main className="p-6">
        {!note? (
          <div>Loading…</div>
        ) : (
          <div>
            <NoteHeader
              note={note}
              title={title}
              setTitle={setTitle}
              saving={saving}
              onTogglePublic={togglePublic}
              onToggleStar={handleToggleStar}
              onToggleArchive={handleToggleArchive}
              onDelete={remove}
            />
            <NoteEditor
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              onSave={handleSaveNote}
            />
            <div className="mt-4">
              <ShareModal shareUrl={shareUrl} onCreate={createShare} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}