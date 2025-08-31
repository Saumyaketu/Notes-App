import React from "react";
import NoteCard from "./NoteCard";
export default function NoteList({ notes, filter, query }) {
  if (!notes || notes.length === 0)
    return <div className="text-gray-500">No notes yet</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {notes.map((n) => (
        <NoteCard key={n._id} note={n} filter={filter} query={query} />
      ))}
    </div>
  );
}
