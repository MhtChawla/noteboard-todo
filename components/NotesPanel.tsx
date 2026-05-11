"use client";

import { useState, useEffect, useRef } from "react";
import { loadNotes, saveNotes } from "@/lib/storage";

export default function NotesPanel() {
  const [notes, setNotes] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [saved, setSaved] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  function handleChange(val: string) {
    setNotes(val);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveNotes(val);
      setSaved(true);
    }, 600);
  }

  return (
    <div
      className="flex flex-col bg-white border-l border-[#d0d7de] transition-all duration-200"
      style={{ width: collapsed ? "44px" : "260px", minWidth: collapsed ? "44px" : "260px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#d0d7de] flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#57606a">
              <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5Z"/>
            </svg>
            <span className="text-xs font-semibold text-[#1f2328]">Notes</span>
            <span className="text-[10px] text-[#8c959f]">{saved ? "Saved" : "Saving…"}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa] rounded-md p-1 transition-colors flex-shrink-0"
          title={collapsed ? "Expand notes" : "Collapse notes"}
        >
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"/>
          </svg>
        </button>
      </div>

      {/* Textarea */}
      {!collapsed && (
        <textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={"Jot anything here...\n\nThis is your personal scratch pad — completely separate from the board."}
          className="flex-1 w-full p-3 text-xs text-[#1f2328] placeholder-[#8c959f] leading-relaxed resize-none focus:outline-none"
          style={{ fontFamily: "inherit" }}
        />
      )}

      {collapsed && (
        <div className="flex flex-col items-center pt-4 gap-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#adb5bd">
            <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5Z"/>
          </svg>
        </div>
      )}
    </div>
  );
}
