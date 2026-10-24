"use client";

import { useState, useEffect, useRef } from "react";
import { loadAllData, saveQuickNotes } from "@/lib/storage";
import { QuickNote } from "@/lib/types";

function genId() {
  return `qn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { day: "numeric", month: "short" });
}

/** Textarea that grows with its content */
function AutoTextarea({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Jot something down…"
      rows={2}
      className="w-full resize-none bg-transparent text-xs leading-relaxed text-[#1f2328] placeholder-[#8c959f] focus:outline-none overflow-hidden"
    />
  );
}

export default function QuickNotesPanel() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    loadAllData()
      .then((data) => {
        setNotes(data.quickNotes);
        setLoaded(true);
      })
      .catch(() => setLoadFailed(true));
  }, [loadAttempt]);

  // Only save after a successful load (unchanged notes are skipped by storage)
  useEffect(() => {
    if (loaded) saveQuickNotes(notes);
  }, [notes, loaded]);

  function addNote() {
    const now = Date.now();
    const note: QuickNote = { id: genId(), text: "", createdAt: now, updatedAt: now };
    setNotes((prev) => [note, ...prev]);
    setFocusId(note.id);
  }

  function updateNote(id: string, text: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n)));
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* New note */}
      <div className="p-2 border-b border-[#d0d7de] flex-shrink-0">
        <button
          onClick={addNote}
          disabled={!loaded}
          className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 bg-[#1f2328] text-white rounded-md hover:bg-[#2d333b] disabled:opacity-40 transition-colors font-medium"
        >
          <span className="text-sm leading-none">+</span> New note
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {!loaded && !loadFailed && <p className="text-[11px] text-[#8c959f] text-center mt-4">Loading…</p>}
        {loadFailed && (
          <div className="text-center mt-4 px-2">
            <p className="text-[11px] text-[#cf222e]">Couldn&apos;t load quick notes. Nothing was changed.</p>
            <button
              onClick={() => { setLoadFailed(false); setLoadAttempt((n) => n + 1); }}
              className="mt-2 text-[11px] font-medium px-3 py-1 rounded-md border border-[#d0d7de] text-[#1f2328] hover:bg-[#f6f8fa]"
            >
              Retry
            </button>
          </div>
        )}
        {loaded && notes.length === 0 && (
          <p className="text-[11px] text-[#8c959f] text-center mt-4 px-2">
            No quick notes yet. Rough ideas, reminders, anything — kept separate from the board.
          </p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="group rounded-md border border-[#d0d7de] bg-[#f6f8fa] px-2.5 pt-2 pb-1.5">
            <AutoTextarea
              value={note.text}
              onChange={(v) => updateNote(note.id, v)}
              autoFocus={note.id === focusId}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-[#8c959f]">{formatTime(note.updatedAt)}</span>
              <button
                onClick={() => deleteNote(note.id)}
                title="Delete note"
                className="opacity-0 group-hover:opacity-100 text-[#57606a] hover:text-[#cf222e] transition-all p-0.5 rounded"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
