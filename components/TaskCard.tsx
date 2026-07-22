"use client";

import { useState, useRef } from "react";
import { Task, Status, COLUMNS } from "@/lib/types";

interface Props {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (status: Status) => void;
  onSelect?: (id: string) => void;
}

function renderWithLinks(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[#0969da] underline underline-offset-2 hover:text-[#0550ae] break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export default function TaskCard({ task, onUpdate, onDelete, onDragStart, onDrop, onSelect }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ghostRef = useRef<HTMLDivElement | null>(null);
  const touchOffsetX = useRef(0);
  const touchOffsetY = useRef(0);
  const touchDragging = useRef(false);
  const touchMoved = useRef(false);

  const col = COLUMNS.find((c) => c.id === task.status)!;

  function saveEdit() {
    onUpdate(task.id, { title: editTitle.trim() || task.title, description: editDesc });
    setEditing(false);
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(task.id);
    (e.currentTarget as HTMLElement).classList.add("card-dragging");
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).classList.remove("card-dragging");
  }

  function getColumnUnderPoint(x: number, y: number): Status | null {
    // ghost already has pointer-events:none so elementFromPoint sees through it
    const el = document.elementFromPoint(x, y);
    const zone = el?.closest("[data-column-status]");
    return (zone?.getAttribute("data-column-status") as Status) ?? null;
  }

  function setColumnHighlight(status: Status | null) {
    document.querySelectorAll("[data-column-status]").forEach((el) => {
      (el as HTMLElement).style.outline = "";
    });
    if (status) {
      const zone = document.querySelector(`[data-column-status="${status}"]`);
      if (zone) (zone as HTMLElement).style.outline = "2px solid #0969da";
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (editing) return;
    const touch = e.touches[0];
    touchMoved.current = false;
    touchDragging.current = false;

    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    touchOffsetX.current = touch.clientX - rect.left;
    touchOffsetY.current = touch.clientY - rect.top;

    // Use a short delay so quick taps still register as clicks
    const startX = touch.clientX;
    const startY = touch.clientY;

    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (!touchDragging.current && Math.hypot(dx, dy) > 6) {
        // Crossed threshold — start drag
        touchDragging.current = true;
        touchMoved.current = true;
        onDragStart(task.id);

        // Create ghost
        const ghost = cardEl.cloneNode(true) as HTMLDivElement;
        ghost.style.cssText = `
          position:fixed;
          top:${rect.top}px;
          left:${rect.left}px;
          width:${rect.width}px;
          pointer-events:none;
          opacity:0.85;
          transform:rotate(2deg) scale(1.03);
          z-index:9999;
          box-shadow:0 8px 24px rgba(0,0,0,0.18);
          border-radius:8px;
          transition:none;
        `;
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
      }

      if (touchDragging.current) {
        ev.preventDefault();
        if (ghostRef.current) {
          ghostRef.current.style.left = `${t.clientX - touchOffsetX.current}px`;
          ghostRef.current.style.top = `${t.clientY - touchOffsetY.current}px`;
        }
        setColumnHighlight(getColumnUnderPoint(t.clientX, t.clientY));
      }
    };

    const onEnd = (ev: TouchEvent) => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);

      if (!touchDragging.current) return;
      touchDragging.current = false;

      const t = ev.changedTouches[0];
      const targetStatus = getColumnUnderPoint(t.clientX, t.clientY);

      ghostRef.current?.remove();
      ghostRef.current = null;
      setColumnHighlight(null);

      if (targetStatus) onDrop(targetStatus);
    };

    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        // Suppress click after a touch-drag so the card doesn't open
        if (touchMoved.current) { touchMoved.current = false; e.stopPropagation(); return; }
      }}
      className="fade-in bg-white rounded-lg border border-[#d0d7de] shadow-[0_1px_3px_rgba(31,35,40,0.06)] hover:shadow-[0_3px_8px_rgba(31,35,40,0.1)] transition-all duration-150 cursor-grab active:cursor-grabbing group task-card"
    >
      {editing ? (
        <div className="p-3 flex flex-col gap-2">
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            className="text-sm font-semibold text-[#1f2328] border border-[#0969da] rounded-md px-2 py-1 w-full focus:ring-2 focus:ring-[#0969da]/20"
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={3}
            placeholder="Description (optional)"
            className="text-xs text-[#57606a] border border-[#d0d7de] rounded-md px-2 py-1 w-full focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20 transition-colors"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="text-xs px-3 py-1 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] text-[#57606a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="text-xs px-3 py-1 rounded-md bg-[#1f2328] text-white hover:bg-[#2d3748] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3" onClick={() => onSelect?.(task.id)}>
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-[#1f2328] flex-1 leading-snug">{task.title}</span>
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
                className="opacity-0 group-hover:opacity-100 text-[#57606a] hover:text-[#1f2328] transition-all p-0.5 rounded hover:bg-[#f6f8fa]"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 z-50 bg-white border border-[#d0d7de] rounded-lg shadow-lg py-1 min-w-[130px] fade-in task-card-menu">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(true); setShowMenu(false); }}
                    className="w-full text-left text-xs px-3 py-1.5 hover:bg-[#f6f8fa] text-[#1f2328] transition-colors"
                  >
                    Edit
                  </button>
                  <div className="border-t border-[#f0f0f0] my-1" />
                  <div className="px-2 py-1">
                    <p className="text-[10px] text-[#57606a] mb-1 font-medium uppercase tracking-wide">Move to</p>
                    {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { onUpdate(task.id, { status: c.id as Status }); setShowMenu(false); }}
                        className="w-full text-left text-xs px-1 py-1 hover:bg-[#f6f8fa] rounded text-[#1f2328] transition-colors flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.accent }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[#f0f0f0] my-1" />
                  <button
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    className="w-full text-left text-xs px-3 py-1.5 hover:bg-[#fff0ef] text-[#cf222e] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-[#57606a] mt-1.5 leading-relaxed line-clamp-3">{renderWithLinks(task.description)}</p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: col.color, color: col.dotColor, border: `1px solid ${col.accent}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.dotColor }} />
              {col.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
