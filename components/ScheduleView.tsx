"use client";

import { useRef, useState } from "react";
import { Task, ScheduleSlots } from "@/lib/types";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM (slots 8-9 … 20-21)

function slotLabel(h: number): string {
  const fmt = (n: number) => (n === 12 ? "12" : n > 12 ? String(n - 12) : String(n));
  const ap = (n: number) => (n >= 12 ? "PM" : "AM");
  if (ap(h) === ap(h + 1)) return `${fmt(h)}–${fmt(h + 1)} ${ap(h)}`;
  return `${fmt(h)} ${ap(h)} – ${fmt(h + 1)} ${ap(h + 1)}`;
}

interface Props {
  tasks: Task[];
  slots: ScheduleSlots;
  dragTaskId: React.MutableRefObject<string | null>;
  onDropToSlot: (hour: number) => void;
  onRemoveFromSlot: (hour: number, taskId: string) => void;
}

export default function ScheduleView({ tasks, slots, dragTaskId, onDropToSlot, onRemoveFromSlot }: Props) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d0d7de] bg-white flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="#57606a">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/>
        </svg>
        <span className="text-xs font-semibold text-[#1f2328]">Today&apos;s Schedule</span>
        <span className="text-[10px] text-[#8c959f] ml-1">drag todos into a slot to schedule them</span>
      </div>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {HOURS.map((hour) => {
          const slotTaskIds = slots[hour] ?? [];
          const slotTasks = slotTaskIds.map((id) => taskMap[id]).filter(Boolean);
          const isOver = dragOverHour === hour;

          return (
            <div
              key={hour}
              className="flex items-start gap-3 group"
              onDragOver={(e) => { e.preventDefault(); setDragOverHour(hour); }}
              onDragLeave={() => setDragOverHour(null)}
              onDrop={() => { onDropToSlot(hour); setDragOverHour(null); }}
            >
              {/* Hour label */}
              <div className="w-24 flex-shrink-0 pt-2">
                <span className="text-[11px] font-medium text-[#57606a] tabular-nums">{slotLabel(hour)}</span>
              </div>

              {/* Drop zone */}
              <div
                className="flex-1 min-h-[36px] rounded-lg border-2 border-dashed flex flex-wrap gap-1.5 p-1.5 transition-all duration-150"
                style={{
                  borderColor: isOver ? "#54aeff" : "#d0d7de",
                  background: isOver ? "#ddf4ff" : slotTasks.length > 0 ? "#fff8e1" : "transparent",
                }}
              >
                {slotTasks.length === 0 && !isOver && (
                  <span className="text-[10px] text-[#adb5bd] self-center pl-1 select-none">
                    ══════════════
                  </span>
                )}
                {slotTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-1 bg-white border border-[#f9c513] rounded-md px-2 py-0.5 text-[11px] text-[#1f2328] font-medium shadow-sm group/chip"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9a6700] flex-shrink-0" />
                    <span className="max-w-[160px] truncate">{task.title}</span>
                    <button
                      onClick={() => onRemoveFromSlot(hour, task.id)}
                      className="opacity-0 group-hover/chip:opacity-100 text-[#cf222e] ml-0.5 leading-none transition-opacity hover:text-[#a40e26]"
                      title="Remove from slot"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
