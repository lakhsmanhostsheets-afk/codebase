"use client";

import { useState } from "react";
import { FormField, inputClassName } from "@/components/ui/form-field";

type Note = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; designation?: string | null };
};

type NotesPanelProps = {
  taskId: string;
  initialNotes: Note[];
};

export function NotesPanel({ taskId, initialNotes }: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add note.");
      setNotes((prev) => [data.note, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addNote} className="rounded-xl border border-slate-200 bg-white p-4">
        <FormField label="Add note">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className={`${inputClassName} min-h-[80px] py-2`}
            placeholder="Capture updates, blockers, or context..."
          />
        </FormField>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Note"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {note.author.name}
                {note.author.designation ? ` (${note.author.designation})` : ""} ·{" "}
                {new Date(note.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
