"use client";

import { useState } from "react";
import { Task, EisenhowerQuadrant, EisenhowerSlots } from "@/lib/types";
import { saveEisenhowerSlots, saveEisenhowerCrossed } from "@/lib/storage";

const QUADRANTS: {
  id: EisenhowerQuadrant;
  label: string;
  desc: string;
  bg: string;
  col: number;
  row: number;
}[] = [
  { id: "do",       label: "Do",       desc: "Urgent tasks with deadlines or consequences",     bg: "#61A184", col: 1, row: 1 },
  { id: "schedule", label: "Schedule", desc: "Important tasks with no immediate deadline",       bg: "#F08D75", col: 2, row: 1 },
  { id: "delegate", label: "Delegate", desc: "Tasks that don't require your specific skill set", bg: "#4672D2", col: 1, row: 2 },
  { id: "eliminate",label: "Eliminate",desc: "Distractions and unnecessary tasks",               bg: "#F3686B", col: 2, row: 2 },
];

interface Props {
  tasks: Task[];
  dragTaskId: React.MutableRefObject<string | null>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  initialSlots: EisenhowerSlots;
  initialCrossed: string[];
}

const EMPTY_EISENHOWER: EisenhowerSlots = { do: [], schedule: [], delegate: [], eliminate: [] };

export default function EisenhowerView({ tasks, dragTaskId, onUpdateTask, initialSlots, initialCrossed }: Props) {
  const [slots, setSlots] = useState<EisenhowerSlots>(() => ({ ...EMPTY_EISENHOWER, ...initialSlots }));
  const [crossed, setCrossed] = useState<string[]>(() => initialCrossed);
  const [dragOver, setDragOver] = useState<EisenhowerQuadrant | null>(null);

  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  function drop(quadrant: EisenhowerQuadrant) {
    const id = dragTaskId.current;
    if (!id) return;
    onUpdateTask(id, { status: "progress" });
    setSlots((prev) => {
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
    onUpdateTask(id, { status: isCrossed ? "progress" : "complete" });
  }

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "28px 1fr 1fr",
        gridTemplateRows: "28px 1fr 1fr",
        gap: 0,
        overflow: "hidden",
        padding: "12px",
        paddingLeft: "4px",
      }}
    >
      {/* Top-left corner: empty */}
      <div />

      {/* Top axis: Urgent */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#57606a", letterSpacing: "0.02em" }}>Urgent</span>
      </div>

      {/* Top axis: Not urgent */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#57606a", letterSpacing: "0.02em" }}>Not urgent</span>
      </div>

      {/* Left axis: Important */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#57606a",
            letterSpacing: "0.02em",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          Important
        </span>
      </div>

      {/* Q1: Do — Urgent + Important */}
      {QUADRANTS.filter((q) => q.col === 1 && q.row === 1).map((q) => (
        <Quadrant key={q.id} q={q} slots={slots} taskMap={taskMap} crossed={crossed} dragOver={dragOver}
          onDragOver={setDragOver} onDrop={drop} onRemove={remove} onToggle={toggleCross} isFirst />
      ))}

      {/* Q2: Schedule — Not urgent + Important */}
      {QUADRANTS.filter((q) => q.col === 2 && q.row === 1).map((q) => (
        <Quadrant key={q.id} q={q} slots={slots} taskMap={taskMap} crossed={crossed} dragOver={dragOver}
          onDragOver={setDragOver} onDrop={drop} onRemove={remove} onToggle={toggleCross} />
      ))}

      {/* Left axis: Not important */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#57606a",
            letterSpacing: "0.02em",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          Not important
        </span>
      </div>

      {/* Q3: Delegate — Urgent + Not important */}
      {QUADRANTS.filter((q) => q.col === 1 && q.row === 2).map((q) => (
        <Quadrant key={q.id} q={q} slots={slots} taskMap={taskMap} crossed={crossed} dragOver={dragOver}
          onDragOver={setDragOver} onDrop={drop} onRemove={remove} onToggle={toggleCross} />
      ))}

      {/* Q4: Eliminate — Not urgent + Not important */}
      {QUADRANTS.filter((q) => q.col === 2 && q.row === 2).map((q) => (
        <Quadrant key={q.id} q={q} slots={slots} taskMap={taskMap} crossed={crossed} dragOver={dragOver}
          onDragOver={setDragOver} onDrop={drop} onRemove={remove} onToggle={toggleCross} />
      ))}
    </div>
  );
}

function Quadrant({
  q, slots, taskMap, crossed, dragOver, onDragOver, onDrop, onRemove, onToggle, isFirst,
}: {
  q: typeof QUADRANTS[0];
  slots: EisenhowerSlots;
  taskMap: Record<string, Task>;
  crossed: string[];
  dragOver: EisenhowerQuadrant | null;
  onDragOver: (id: EisenhowerQuadrant) => void;
  onDrop: (id: EisenhowerQuadrant) => void;
  onRemove: (id: EisenhowerQuadrant, taskId: string) => void;
  onToggle: (taskId: string) => void;
  isFirst?: boolean;
}) {
  const ids = slots[q.id];
  const quadrantTasks = ids.map((id) => taskMap[id]).filter(Boolean) as Task[];
  const isOver = dragOver === q.id;
  const doneCount = crossed.filter((id) => ids.includes(id)).length;

  const borderRadius = isFirst
    ? "10px 0 0 0"
    : q.col === 2 && q.row === 1
    ? "0 10px 0 0"
    : q.col === 1 && q.row === 2
    ? "0 0 0 10px"
    : "0 0 10px 0";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(q.id); }}
      onDragLeave={() => onDragOver(null as unknown as EisenhowerQuadrant)}
      onDrop={() => onDrop(q.id)}
      style={{
        background: isOver ? lighten(q.bg) : q.bg,
        borderRadius,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "background 0.15s",
        border: isOver ? "2px dashed rgba(255,255,255,0.7)" : "2px solid transparent",
        margin: "1px",
      }}
    >
      {/* Header */}
      <div style={{ padding: "10px 12px 6px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.01em" }}>
            {q.label}:
          </span>
          {quadrantTasks.length > 0 && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
              {doneCount}/{quadrantTasks.length}
            </span>
          )}
        </div>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
          {q.desc}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "0 10px" }} />

      {/* Tasks */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
        {quadrantTasks.length === 0 && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", margin: "auto", userSelect: "none" }}>
            drop tasks here
          </span>
        )}
        {quadrantTasks.map((task) => {
          const isCrossed = crossed.includes(task.id);
          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: isCrossed ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.92)",
                borderRadius: 6,
                padding: "4px 6px 4px 5px",
              }}
              className="group/chip"
            >
              <button
                type="button"
                onClick={() => onToggle(task.id)}
                title={isCrossed ? "Unmark" : "Mark done"}
                style={{ flexShrink: 0, lineHeight: 0, background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                {isCrossed ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" fill="rgba(255,255,255,0.9)" />
                    <path d="M4 7.5l2 2 4-4.5" stroke={q.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke={q.bg} strokeWidth="1.5" fill="none" />
                  </svg>
                )}
              </button>

              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 500,
                  color: isCrossed ? "rgba(255,255,255,0.6)" : "#1f2328",
                  textDecoration: isCrossed ? "line-through" : "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {task.title}
              </span>

              <button
                type="button"
                onClick={() => onRemove(q.id, task.id)}
                title="Remove"
                style={{
                  flexShrink: 0,
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: isCrossed ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isCrossed ? "#fff" : "#1f2328",
                  opacity: 0.35,
                  transition: "opacity 0.15s, background 0.15s",
                }}
                className="group-hover/chip:!opacity-100"
                onMouseEnter={(e) => (e.currentTarget.style.background = isCrossed ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = isCrossed ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)")}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.15));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
