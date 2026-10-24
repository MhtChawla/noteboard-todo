import { Task, WeekSchedule } from "./types";

export const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

// Build visual slots from HOURS + mergedBoundaries
// A merged boundary at hour h means h and h+1 are in the same visual slot.
export function buildVisualSlots(mergedBoundaries: number[]): { hours: number[] }[] {
  const boundarySet = new Set(mergedBoundaries);
  const slots: { hours: number[] }[] = [];
  let current: number[] = [];
  for (const h of HOURS) {
    current.push(h);
    if (!boundarySet.has(h)) {
      slots.push({ hours: current });
      current = [];
    }
  }
  if (current.length > 0) slots.push({ hours: current });
  return slots;
}

/** Local calendar date as "YYYY-MM-DD" (sorts correctly as a string) */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** `count` consecutive date keys starting at `start` */
export function nextDays(start: string, count: number): string[] {
  const base = parseDateKey(start);
  return Array.from({ length: count }, (_, i) =>
    dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i))
  );
}

/** Drop days before `today`; returns the task IDs that were scheduled on them */
export function rolloverWeek(week: WeekSchedule, today: string) {
  const schedule: WeekSchedule = {};
  const leftoverIds: string[] = [];
  let changed = false;
  for (const [day, sched] of Object.entries(week)) {
    if (day < today) {
      changed = true;
      for (const ids of Object.values(sched.slots)) leftoverIds.push(...ids);
    } else {
      schedule[day] = sched;
    }
  }
  return { schedule, leftoverIds, changed };
}

/** Unfinished tasks from past days go back to To Do */
export function resetLeftovers(tasks: Task[], leftoverIds: string[]): Task[] {
  if (leftoverIds.length === 0) return tasks;
  const ids = new Set(leftoverIds);
  return tasks.map((t) => (ids.has(t.id) && t.status === "progress" ? { ...t, status: "todo" } : t));
}
