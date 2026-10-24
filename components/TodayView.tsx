"use client";

import { useState } from "react";
import { Task, DaySchedule } from "@/lib/types";
import { buildVisualSlots } from "@/lib/week";

function slotLabel(startH: number, endH: number): string {
  const fmt = (n: number) => (n === 12 ? "12" : n > 12 ? String(n - 12) : String(n));
  const ap = (n: number) => (n >= 12 ? "PM" : "AM");
  const start = `${fmt(startH)} ${ap(startH)}`;
  const end = `${fmt(endH)} ${ap(endH)}`;
  if (ap(startH) === ap(endH)) return `${fmt(startH)}–${fmt(endH)} ${ap(startH)}`;
  return `${start} – ${end}`;
}

interface Props {
  tasks: Task[];
  sched: DaySchedule;
  onDropToSlot: (hour: number) => void;
  onRemoveFromSlot: (hour: number, taskId: string) => void;
  onCompleteSlot: (hours: number[]) => void;
  onMergeBoundary: (hour: number) => void;
  onUnmergeBoundary: (hour: number) => void;
  onSelectTask?: (taskId: string) => void;
}

/** Single-day hourly schedule — the original full-width layout */
export default function TodayView({
  tasks,
  sched,
  onDropToSlot,
  onRemoveFromSlot,
  onCompleteSlot,
  onMergeBoundary,
  onUnmergeBoundary,
  onSelectTask,
}: Props) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [hoveredBetween, setHoveredBetween] = useState<number | null>(null);
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const visualSlots = buildVisualSlots(sched.merged);
  const boundarySet = new Set(sched.merged);

  return (
  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-0">
      {visualSlots.map((vslot, vIdx) => {
        const startH = vslot.hours[0];
        const endH = vslot.hours[vslot.hours.length - 1] + 1;
        const isMerged = vslot.hours.length > 1;

        // Collect all task IDs across all hours in this visual slot
        const slotTaskIds = vslot.hours.flatMap((h) => sched.slots[h] ?? []);
        const slotTasks = [...new Map(slotTaskIds.map((id) => [id, taskMap[id]])).values()].filter(Boolean) as Task[];

        const isOver = vslot.hours.includes(dragOverHour ?? -1);
        const isSlotComplete = slotTasks.length > 0 && slotTasks.every((t) => t.status === "complete");

        // The "between" boundary after this visual slot
        const nextVslot = visualSlots[vIdx + 1];
        const boundaryHour = nextVslot ? vslot.hours[vslot.hours.length - 1] : null;
        const isBoundaryMerged = boundaryHour !== null && boundarySet.has(boundaryHour);

        return (
          <div key={startH}>
            {/* The visual slot row */}
            <div
              className="flex items-start gap-3 group py-1"
              onDragOver={(e) => { e.preventDefault(); setDragOverHour(startH); }}
              onDragLeave={() => setDragOverHour(null)}
              onDrop={() => { onDropToSlot(startH); setDragOverHour(null); }}
            >
              {/* Hour label */}
              <div className="w-24 flex-shrink-0 pt-2">
                <span className="text-[11px] font-medium text-[#57606a] tabular-nums">
                  {slotLabel(startH, endH)}
                </span>
                {isMerged && (
                  <button
                    onClick={() => {
                      // unmerge all boundaries in this visual slot
                      vslot.hours.slice(0, -1).forEach((h) => onUnmergeBoundary(h));
                    }}
                    className="block mt-0.5 text-[9px] text-[#8c959f] hover:text-[#cf222e] transition-colors leading-none"
                    title="Unmerge"
                  >
                    unmerge
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div
                className="flex-1 rounded-lg border-2 border-dashed flex flex-wrap gap-1.5 p-1.5 transition-all duration-150"
                style={{
                  minHeight: `${vslot.hours.length * 44 - 8}px`,
                  borderColor: isOver ? "#54aeff" : "#d0d7de",
                  background: isOver ? "#ddf4ff" : slotTasks.length > 0 ? (isSlotComplete ? "#f0fff4" : "#fff8e1") : "transparent",
                }}
              >
                {slotTasks.length === 0 && !isOver && (
                  <span className="text-[10px] text-[#adb5bd] self-center pl-1 select-none">
                    ══════════════
                  </span>
                )}
                {slotTasks.map((task) => {
                  // find which hour this task is in (for removal)
                  const taskHour = vslot.hours.find((h) => (sched.slots[h] ?? []).includes(task.id)) ?? startH;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-1 bg-white border rounded-md px-2 py-0.5 text-[11px] font-medium shadow-sm group/chip"
                      style={{ borderColor: isSlotComplete ? "#2da44e" : "#f9c513" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSlotComplete ? "#2da44e" : "#9a6700" }} />
                      <span
                        className="max-w-[160px] truncate cursor-pointer hover:underline"
                        style={{
                          color: isSlotComplete ? "#57606a" : "#1f2328",
                          textDecoration: isSlotComplete ? "line-through" : "none",
                        }}
                        onClick={() => onSelectTask?.(task.id)}
                      >
                        {task.title}
                      </span>
                      {!isSlotComplete && (
                        <button
                          onClick={() => onRemoveFromSlot(taskHour, task.id)}
                          className="opacity-0 group-hover/chip:opacity-100 text-[#cf222e] ml-0.5 leading-none transition-opacity hover:text-[#a40e26]"
                          title="Remove from slot"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Slot complete tick */}
              {slotTasks.length > 0 && (
                <button
                  onClick={() => {
                    if (!isSlotComplete) onCompleteSlot(vslot.hours);
                  }}
                  title={isSlotComplete ? "Slot completed" : "Mark all as complete"}
                  className="flex-shrink-0 mt-1 transition-transform active:scale-90"
                  style={{ cursor: isSlotComplete ? "default" : "pointer" }}
                >
                  {isSlotComplete ? (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="13" fill="#2da44e" />
                      <path d="M8 14.5l4 4 8-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="13" stroke="#d0d7de" strokeWidth="2" />
                      <path d="M8 14.5l4 4 8-9" stroke="#d0d7de" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Merge button — zero height, floats over the boundary */}
            {boundaryHour !== null && !isBoundaryMerged && (
              <div className="relative h-0 overflow-visible z-10">
                <button
                  onClick={() => onMergeBoundary(boundaryHour)}
                  onMouseEnter={() => setHoveredBetween(boundaryHour)}
                  onMouseLeave={() => setHoveredBetween(null)}
                  title="Merge with next window"
                  style={{ top: "-9px", left: "8px" }}
                  className={`absolute flex items-center justify-center w-[18px] h-[18px] rounded-full border transition-all ${
                    hoveredBetween === boundaryHour
                      ? "border-[#0969da] bg-[#ddf4ff] text-[#0969da] scale-110 opacity-100"
                      : "border-[#d0d7de] bg-white text-[#8c959f] opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 1v8M2 4l3-3 3 3M2 6l3 3 3-3"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
