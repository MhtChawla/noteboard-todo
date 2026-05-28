"use client";

import { useState, useEffect } from "react";
import { Task, COLUMNS } from "@/lib/types";

interface Props {
  task: Task | null;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onClose: () => void;
}

export default function TaskDetailPanel({ task, onUpdate, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Animate in when task appears
  useEffect(() => {
    if (task) {
      setVisible(false);
      // tiny delay so the transition fires after mount
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      setEditing(false);
      setEditTitle(task.title);
      setEditDesc(task.description);
    } else {
      setVisible(false);
    }
  }, [task?.id]);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  function save() {
    if (!task) return;
    onUpdate(task.id, {
      title: editTitle.trim() || task.title,
      description: editDesc,
    });
    setEditing(false);
  }

  function cancelEdit() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditing(false);
  }

  if (!task) return null;

  const col = COLUMNS.find((c) => c.id === task.status)!;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 z-30 transition-all duration-200"
        style={{
          background: visible ? "rgba(31,35,40,0.18)" : "rgba(31,35,40,0)",
          backdropFilter: visible ? "blur(1px)" : "none",
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        className="absolute top-0 left-0 bottom-0 z-40 flex flex-col bg-white border-r border-[#d0d7de] shadow-2xl"
        style={{
          width: "70%",
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: col.color, color: col.dotColor, border: `1px solid ${col.accent}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.dotColor }} />
              {col.label}
            </span>
            <span className="text-[11px] text-[#8c959f]">
              {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <button
            onClick={close}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {editing ? (
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#57606a] uppercase tracking-wide">Title</label>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancelEdit(); }}
                  className="text-base font-semibold text-[#1f2328] border border-[#d0d7de] rounded-lg px-3 py-2 outline-none focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/15 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#57606a] uppercase tracking-wide">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                  rows={8}
                  placeholder="Add a description..."
                  className="text-sm text-[#57606a] border border-[#d0d7de] rounded-lg px-3 py-2 outline-none focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/15 resize-none leading-relaxed transition-all"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  className="text-sm px-4 py-1.5 rounded-lg bg-[#1f2328] text-white hover:bg-[#2d333b] transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-sm px-4 py-1.5 rounded-lg border border-[#d0d7de] text-[#57606a] hover:bg-[#f6f8fa] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-[#1f2328] leading-snug">{task.title}</h2>
                <button
                  onClick={() => { setEditTitle(task.title); setEditDesc(task.description); setEditing(true); }}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa] border border-[#d0d7de] px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/>
                  </svg>
                  Edit
                </button>
              </div>

              <div className="h-px bg-[#f0f2f4]" />

              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-[#57606a] uppercase tracking-wide">Description</p>
                {task.description ? (
                  <p className="text-sm text-[#1f2328] leading-relaxed whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-sm text-[#8c959f] italic">No description yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
