"use client";

import { useState } from "react";
import { Task, WeekSchedule, EisenhowerSlots } from "@/lib/types";
import { HOURS, buildVisualSlots, parseDateKey } from "@/lib/week";
import EisenhowerView from "./EisenhowerView";
import TodayView from "./TodayView";

const ROW_H = 64; // px per hour row — every day column shares it so hours line up

function hourLabel(h: number): string {
  const n = h === 12 ? 12 : h > 12 ? h - 12 : h;
  return `${n} ${h >= 12 ? "PM" : "AM"}`;
}

interface Props {
  tasks: Task[];
  week: WeekSchedule;
  days: string[]; // date keys, today first
  todayKey: string;
  dragTaskId: React.MutableRefObject<string | null>;
  onDropToSlot: (day: string, hour: number) => void;
  onRemoveFromSlot: (day: string, hour: number, taskId: string) => void;
  onCompleteSlot: (day: string, hours: number[]) => void;
  onMergeBoundary: (day: string, hour: number) => void;
  onUnmergeBoundary: (day: string, hour: number) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectTask?: (taskId: string) => void;
  eisenhowerSlots: EisenhowerSlots;
  eisenhowerCrossed: string[];
}

export default function ScheduleView({
  tasks,
  week,
  days,
  todayKey,
  dragTaskId,
  onDropToSlot,
  onRemoveFromSlot,
  onCompleteSlot,
  onMergeBoundary,
  onUnmergeBoundary,
  onUpdateTask,
  onSelectTask,
  eisenhowerSlots,
  eisenhowerCrossed,
}: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null); // "day:hour"
  const [eisenhower, setEisenhower] = useState(false);
  const [todayView, setTodayView] = useState(() => localStorage.getItem("todayView") !== "false");
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]));

  const first = parseDateKey(days[0]);
  const last = parseDateKey(days[days.length - 1]);
  const rangeLabel = `${first.toLocaleDateString([], { day: "numeric", month: "short" })} – ${last.toLocaleDateString([], { day: "numeric", month: "short" })}`;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#d0d7de] bg-white flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="#57606a">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/>
        </svg>
        <span className="text-xs font-semibold text-[#1f2328]">{todayView ? "Today's Schedule" : "This Week"}</span>
        <span className="text-[11px] text-[#57606a] tabular-nums">
          {todayView ? first.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : rangeLabel}
        </span>
        <span className="text-[10px] text-[#8c959f] ml-1">drag todos into a slot · click ↕ between slots to merge</span>
        <label className="flex items-center gap-1.5 ml-auto cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-[#1f2328]"
            checked={todayView}
            onChange={(e) => {
              setTodayView(e.target.checked);
              localStorage.setItem("todayView", String(e.target.checked));
            }}
          />
          <span className="text-[11px] text-[#57606a] font-medium">Today&apos;s View</span>
        </label>
        <label className="flex items-center gap-1.5 ml-3 cursor-pointer select-none">
          <input type="checkbox" className="w-3.5 h-3.5 accent-[#1f2328]" checked={eisenhower} onChange={(e) => setEisenhower(e.target.checked)} />
          <span className="text-[11px] text-[#57606a] font-medium">Eisenhower Matrix</span>
        </label>
      </div>

      {/* Eisenhower Matrix */}
      {eisenhower && (
        <EisenhowerView tasks={tasks} dragTaskId={dragTaskId} onUpdateTask={onUpdateTask} initialSlots={eisenhowerSlots} initialCrossed={eisenhowerCrossed} />
      )}

      {/* Today only — the original single-day layout */}
      {!eisenhower && todayView && (
        <TodayView
          tasks={tasks}
          sched={week[todayKey] ?? { slots: {}, merged: [] }}
          onDropToSlot={(h) => onDropToSlot(todayKey, h)}
          onRemoveFromSlot={(h, id) => onRemoveFromSlot(todayKey, h, id)}
          onCompleteSlot={(hours) => onCompleteSlot(todayKey, hours)}
          onMergeBoundary={(h) => onMergeBoundary(todayKey, h)}
          onUnmergeBoundary={(h) => onUnmergeBoundary(todayKey, h)}
          onSelectTask={onSelectTask}
        />
      )}

      {/* Week grid */}
      {!eisenhower && !todayView && (
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-fit pb-4">
            {/* Hour gutter */}
            <div className="sticky left-0 z-20 w-14 flex-shrink-0 bg-white">
              <div className="sticky top-0 z-10 h-12 bg-white border-b border-[#d0d7de]" />
              {HOURS.map((h) => (
                <div key={h} className="pr-2 text-right" style={{ height: ROW_H }}>
                  <span className="relative -top-1.5 text-[10px] font-medium text-[#57606a] tabular-nums">{hourLabel(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const date = parseDateKey(day);
              const isToday = day === todayKey;
              const sched = week[day] ?? { slots: {}, merged: [] };
              const visualSlots = buildVisualSlots(sched.merged);

              return (
                <div key={day} className="flex-1 min-w-[112px] border-l border-[#d0d7de]">
                  {/* Day header */}
                  <div className="sticky top-0 z-10 h-12 flex flex-col items-center justify-center bg-white border-b border-[#d0d7de]">
                    <span className={`text-[9px] font-semibold uppercase tracking-wide ${isToday ? "text-[#0969da]" : "text-[#57606a]"}`}>
                      {isToday ? "Today" : date.toLocaleDateString([], { weekday: "short" })}
                    </span>
                    <span
                      className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold tabular-nums ${isToday ? "bg-[#0969da] text-white" : "text-[#1f2328]"}`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Slots */}
                  {visualSlots.map((vslot, vIdx) => {
                    const startH = vslot.hours[0];
                    const lastH = vslot.hours[vslot.hours.length - 1];
                    const isMerged = vslot.hours.length > 1;
                    const slotKey = `${day}:${startH}`;

                    // Collect all task IDs across all hours in this visual slot
                    const slotTaskIds = vslot.hours.flatMap((h) => sched.slots[h] ?? []);
                    const slotTasks = [...new Map(slotTaskIds.map((id) => [id, taskMap[id]])).values()].filter(Boolean) as Task[];

                    const isOver = dragOver === slotKey;
                    const isSlotComplete = slotTasks.length > 0 && slotTasks.every((t) => t.status === "complete");
                    const hasNext = vIdx < visualSlots.length - 1;

                    return (
                      <div
                        key={startH}
                        className="relative group p-1"
                        style={{ height: vslot.hours.length * ROW_H }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(slotKey); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={() => { onDropToSlot(day, startH); setDragOver(null); }}
                      >
                        {/* Drop zone */}
                        <div
                          className="h-full rounded-md border border-dashed flex flex-col gap-1 p-1 overflow-y-auto transition-colors duration-150"
                          style={{
                            borderColor: isOver ? "#54aeff" : "#d0d7de",
                            background: isOver ? "#ddf4ff" : slotTasks.length > 0 ? (isSlotComplete ? "#f0fff4" : "#fff8e1") : "transparent",
                          }}
                        >
                          {slotTasks.map((task) => {
                            // find which hour this task is in (for removal)
                            const taskHour = vslot.hours.find((h) => (sched.slots[h] ?? []).includes(task.id)) ?? startH;
                            const done = task.status === "complete";
                            return (
                              <div
                                key={task.id}
                                className="flex items-center gap-1 bg-white border rounded px-1.5 py-px text-[10px] font-medium shadow-sm group/chip flex-shrink-0"
                                style={{ borderColor: done ? "#2da44e" : "#f9c513" }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: done ? "#2da44e" : "#9a6700" }} />
                                <span
                                  className="flex-1 min-w-0 truncate cursor-pointer hover:underline"
                                  style={{ color: done ? "#57606a" : "#1f2328", textDecoration: done ? "line-through" : "none" }}
                                  onClick={() => onSelectTask?.(task.id)}
                                  title={task.title}
                                >
                                  {task.title}
                                </span>
                                {!done && (
                                  <button
                                    onClick={() => onRemoveFromSlot(day, taskHour, task.id)}
                                    className="opacity-0 group-hover/chip:opacity-100 text-[#cf222e] leading-none transition-opacity hover:text-[#a40e26]"
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
                            onClick={() => { if (!isSlotComplete) onCompleteSlot(day, vslot.hours); }}
                            title={isSlotComplete ? "Slot completed" : "Mark all as complete"}
                            className={`absolute bottom-2 right-2 transition-all active:scale-90 ${isSlotComplete ? "" : "opacity-0 group-hover:opacity-100"}`}
                            style={{ cursor: isSlotComplete ? "default" : "pointer" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                              {isSlotComplete ? (
                                <>
                                  <circle cx="14" cy="14" r="13" fill="#2da44e" />
                                  <path d="M8 14.5l4 4 8-9" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                              ) : (
                                <>
                                  <circle cx="14" cy="14" r="13" fill="white" stroke="#8c959f" strokeWidth="2" />
                                  <path d="M8 14.5l4 4 8-9" stroke="#8c959f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                              )}
                            </svg>
                          </button>
                        )}

                        {/* Unmerge */}
                        {isMerged && (
                          <button
                            onClick={() => vslot.hours.slice(0, -1).forEach((h) => onUnmergeBoundary(day, h))}
                            className="absolute bottom-2 left-2 text-[9px] text-[#8c959f] hover:text-[#cf222e] opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                            title="Unmerge"
                          >
                            unmerge
                          </button>
                        )}

                        {/* Merge with next slot — sits on the bottom edge */}
                        {hasNext && (
                          <button
                            onClick={() => onMergeBoundary(day, lastH)}
                            title="Merge with next window"
                            className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#d0d7de] bg-white text-[#8c959f] opacity-0 group-hover:opacity-100 hover:border-[#0969da] hover:bg-[#ddf4ff] hover:text-[#0969da] transition-all"
                          >
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 1v8M2 4l3-3 3 3M2 6l3 3 3-3"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
