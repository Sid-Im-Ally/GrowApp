import { useState } from 'react';
import type { Note } from '../types';

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onUpdate: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NotesPanel({ notes, onAdd, onUpdate, onDelete }: Props) {
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function handleAdd() {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewText('');
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditText(note.text);
  }

  function saveEdit(note: Note) {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== note.text) {
      onUpdate({ ...note, text: trimmed, updatedAt: new Date().toISOString() });
    }
    setEditingId(null);
  }

  return (
    <div className="space-y-2 mt-2">
      {notes.length === 0 && (
        <p className="font-mono-grow text-[9px]" style={{ color: 'var(--muted)', opacity: 0.7 }}>
          No notes yet. Add one below.
        </p>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="rounded-xl p-3 group"
          style={{ background: 'var(--paper-3)', border: '1px solid var(--line-soft)' }}
        >
          {editingId === note.id ? (
            <div className="space-y-2">
              <textarea
                className="w-full text-sm rounded-lg p-2 resize-none focus:outline-none"
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(note)}
                  className="text-xs px-3 py-1 rounded-full font-medium transition-colors"
                  style={{ background: 'var(--ink)', color: 'var(--paper)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={{ color: 'var(--muted)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                  {note.text}
                </p>
                <p className="font-mono-grow text-[9px] mt-1.5" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                  {formatDate(note.createdAt)}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => startEdit(note)}
                  className="p-1 rounded text-xs transition-colors"
                  style={{ color: 'var(--muted)' }}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  className="p-1 rounded text-xs transition-colors"
                  style={{ color: 'var(--muted)' }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <textarea
          className="flex-1 text-sm rounded-xl p-2.5 resize-none focus:outline-none"
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
          rows={2}
          placeholder="Add a note..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="self-end text-xs px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-40"
          style={{ background: 'var(--ink)', color: 'var(--paper)' }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
