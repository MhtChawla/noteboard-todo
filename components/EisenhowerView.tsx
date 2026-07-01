"use client";

import { useState, useEffect } from "react";
import { Task, EisenhowerQuadrant, EisenhowerSlots } from "@/lib/types";
import { loadEisenhowerSlots, saveEisenhowerSlots, loadEisenhowerCrossed, saveEisenhowerCrossed } from "@/lib/storage";

const QUADRANTS: {
  id: EisenhowerQuadrant;
  label: string;
  sub: string;
  urgent: boolean;
  important: boolean;
  color: string;
  border: string;
  badge: string;
  badgeText: string;
}[] = [
  {
    id: "do",
    label: "Do",
    sub: "Urgent + Important",
    urgent: true,
    important: true,
    color: "#fff0ef",
    border: "#f85149",
    badge: "#f85149",
    badgeText: "#fff",
  },
  {
    id: "schedule",
    label: "Schedule",
    sub: "Not Urgent + Important",
    urgent: false,
    important: true,
    color: "#ddf4ff",
    border: "#54aeff",
    badge: "#0969da",
    badgeText: "#fff",
  },
  {
    id: "delegate",
    label: "Delegate",
    sub: "Urgent + Not Important",
    urgent: true,
    important: false,
    color: "#fff8e1",
    border: "#f9c513",
    badge: "#9a6700",
    badgeText: "#fff",
  },
  {
    id: "eliminate",
    label: "Eliminate",
    sub: "Not Urgent + Not Important",
    urgent: false,
    important: false,
    color: "#f6f8fa",
    border: "#d0d7de",
    badge: "#57606a",
    badgeText: "#fff",
  },
];

interface Props {
  tasks: Task[];
  dragTaskId: React.MutableRefObject<string | null>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export default function EisenhowerView({ tasks, dragTaskId, onUpdateTask }: Props) {
  const [slots, setSlots] = useState<EisenhowerSlots>({ do: [], schedule: [], delegate: [], eliminate: [] });
  const [crossed, setCrossed] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState<EisenhowerQuadrant | null>(null);

  useEffect(() => {
    setSlots(loadEisenhowerSlots());
    setCrossed(loadEisenhowerCrossed());
  }, []);

  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  function drop(quadrant: EisenhowerQuadrant) {
    const id = dragTaskId.current;
    if (!id) return;
    onUpdateTask(id, { status: "progress" });
    setSlots((prev) => {
      // remove from any existing quadrant first
      const next: EisenhowerSlots = {
        do: prev.do.filter((x) => x !== id),
        schedule: prev.schedule.filter((x) => x !== id),
        delegate: prev.delegate.filter((x) => x !== id),
        eliminate: prev.eliminate.filter((x) => x !== id),
      };
      next[quadrant] = [...next[quadrant], id];
      saveEisenhowerSlots(next);
      return next;
    });
    setDragOver(null);
  }

  function remove(quadrant: EisenhowerQuadrant, id: string) {
    setSlots((prev) => {
      const next = { ...prev, [quadrant]: prev[quadrant].filter((x) => x !== id) };
      saveEisenhowerSlots(next);
      return next;
    });
    const nextCrossed = crossed.filter((x) => x !== id);
    setCrossed(nextCrossed);
    saveEisenhowerCrossed(nextCrossed);
    onUpdateTask(id, { status: "todo" });
  }

  function toggleCross(id: string) {
    const isCrossed = crossed.includes(id);
    const next = isCrossed ? crossed.filter((x) => x !== id) : [...crossed, id];
    setCrossed(next);
    saveEisenhowerCrossed(next);
    onUpdateTask(id, { status: isCrossed ? "todo" : "complete" });
  }

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 p-4 overflow-hidden">
      {/* Axis labels */}
      <div className="contents">
        {QUADRANTS.map((q) => {
          const ids = slots[q.id];
          const quadrantTasks = ids.map((id) => taskMap[id]).filter(Boolean) as Task[];
          const isOver = dragOver === q.id;

          return (
            <div
              key={q.id}
              className="flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-150"
              style={{
                borderColor: isOver ? q.border : "#d0d7de",
                background: isOver ? q.color : "#fafbfc",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(q.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => drop(q.id)}
            >
              {/* Quadrant header */}
              <div
                className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ borderColor: "#d0d7de", background: q.color }}
              >
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: q.badge, color: q.badgeText }}
                >
                  {q.label.toUpperCase()}
                </span>
                <span className="text-[10px] text-[#57606a]">{q.sub}</span>
                {quadrantTasks.length > 0 && (
                  <span className="ml-auto text-[10px] text-[#8c959f]">
                    {crossed.filter((id) => ids.includes(id)).length}/{quadrantTasks.length}
                  </span>
                )}
              </div>

              {/* Task chips */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                {quadrantTasks.length === 0 && (
                  <span className="text-[10px] text-[#adb5bd] m-auto select-none">
                    drop tasks here
                  </span>
                )}
                {quadrantTasks.map((task) => {
                  const isCrossed = crossed.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-1.5 bg-white border rounded-lg px-2 py-1 text-[11px] shadow-sm group/chip"
                      style={{ borderColor: isCrossed ? "#2da44e" : q.border }}
                    >
                      {/* Cross toggle */}
                      <button
                        onClick={() => toggleCross(task.id)}
                        title={isCrossed ? "Unmark" : "Mark as done"}
                        className="flex-shrink-0 transition-transform active:scale-90"
                      >
                        {isCrossed ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" fill="#2da44e" />
                            <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="#d0d7de" strokeWidth="1.5" />
                          </svg>
                        )}
                      </button>

                      <span
                        className="flex-1 truncate"
                        style={{
                          color: isCrossed ? "#8c959f" : "#1f2328",
                          textDecoration: isCrossed ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => remove(q.id, task.id)}
                        className="opacity-0 group-hover/chip:opacity-100 text-[#cf222e] leading-none transition-opacity hover:text-[#a40e26] flex-shrink-0"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
