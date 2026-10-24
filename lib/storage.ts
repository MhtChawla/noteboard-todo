import { supabase } from "./supabase";
import { Task, RecurringTask, Plan, Pointer, FutureTask, ScheduleSlots, EisenhowerSlots, QuickNote, WeekSchedule } from "./types";

const TASKS_KEY = "noteboard_tasks";
const NOTES_KEY = "noteboard_notes";
const RECURRING_KEY = "noteboard_recurring";
const PLANS_KEY = "noteboard_plans";
const POINTERS_KEY = "noteboard_pointers";
const FUTURE_KEY = "noteboard_future";
// Legacy single-day schedule — read only, to migrate into the week schedule
const SCHEDULE_KEY = "noteboard_schedule";
const MERGED_BOUNDARIES_KEY = "noteboard_merged_boundaries";
const WEEK_SCHEDULE_KEY = "noteboard_week_schedule";
const PLANS_OVERVIEW_KEY = "noteboard_plans_overview";
const EISENHOWER_SLOTS_KEY = "noteboard_eisenhower_slots";
const EISENHOWER_CROSSED_KEY = "noteboard_eisenhower_crossed";
const QUICK_NOTES_KEY = "noteboard_quick_notes";

// Each deployment is scoped to one board (one user's data).
const BOARD_ID = process.env.NEXT_PUBLIC_BOARD_ID || "mohit";

// ── Save safety ──
// Board data is irreplaceable, so writes follow three rules:
// 1. Nothing is written until a load has succeeded — a failed load must never
//    turn into an empty board saved over the real one.
// 2. A value identical to what the server holds is never re-sent, so opening
//    the app writes nothing.
// 3. Failed writes stay queued and are retried until they land.

export type SaveStatus = "saved" | "saving" | "error";

const serverValues = new Map<string, string>(); // last value known to be in the database
const pending = new Map<string, string>(); // latest value per key still waiting to be written
let loadedOnce = false;
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 2000;
let saveStatus: SaveStatus = "saved";
const statusListeners = new Set<() => void>();

function setSaveStatus(next: SaveStatus) {
  if (saveStatus === next) return;
  saveStatus = next;
  statusListeners.forEach((l) => l());
}

export function getSaveStatus(): SaveStatus {
  return saveStatus;
}

export function subscribeSaveStatus(cb: () => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

function dbSet(key: string, value: string): void {
  if (!loadedOnce) {
    console.error(`Not saving "${key}": board data has not loaded successfully yet`);
    return;
  }
  if (!pending.has(key) && serverValues.get(key) === value) return;
  pending.set(key, value);
  void flush();
}

async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  setSaveStatus("saving");

  let failed = false;
  while (pending.size > 0 && !failed) {
    for (const [key, value] of [...pending]) {
      let ok = false;
      try {
        const { error } = await supabase
          .from("kv_store")
          .upsert({ board: BOARD_ID, key, value }, { onConflict: "board,key" });
        ok = !error;
        if (error) console.error(`Saving "${key}" failed, will retry:`, error.message);
      } catch (err) {
        console.error(`Saving "${key}" failed, will retry:`, err);
      }
      if (!ok) {
        failed = true;
        break;
      }
      serverValues.set(key, value);
      // Edits made while this write was in flight stay queued for the next pass
      if (pending.get(key) === value) pending.delete(key);
    }
  }

  flushing = false;
  if (failed) {
    setSaveStatus("error");
    retryTimer = setTimeout(() => void flush(), retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  } else {
    retryDelay = 2000;
    setSaveStatus("saved");
  }
}

// Warn before closing the tab while changes are still unsaved
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (pending.size > 0) e.preventDefault();
  });
}

// ── Load all data in one round-trip ──

export interface AllData {
  tasks: Task[];
  notes: string;
  recurringTasks: RecurringTask[];
  plans: Plan[];
  pointers: Pointer[];
  futureTasks: FutureTask[];
  scheduleSlots: ScheduleSlots;
  mergedBoundaries: number[];
  weekSchedule: WeekSchedule | null; // null until first migrated
  plansOverview: string;
  eisenhowerSlots: EisenhowerSlots;
  eisenhowerCrossed: string[];
  quickNotes: QuickNote[];
}

const EMPTY_EISENHOWER: EisenhowerSlots = { do: [], schedule: [], delegate: [], eliminate: [] };

let inflightLoad: Promise<AllData> | null = null;

/** Rejects if the database can't be read — callers must then save nothing */
export function loadAllData(): Promise<AllData> {
  inflightLoad ??= fetchAllData().finally(() => {
    inflightLoad = null;
  });
  return inflightLoad;
}

async function fetchAllData(): Promise<AllData> {
  const { data, error } = await supabase
    .from("kv_store")
    .select("key, value")
    .eq("board", BOARD_ID);
  if (error || !data) throw new Error(error?.message ?? "No data returned");

  const map = new Map<string, string>();
  for (const row of data) {
    map.set(row.key, row.value);
    serverValues.set(row.key, row.value);
  }
  // Edits not yet written win over the older copy in the database
  for (const [key, value] of pending) map.set(key, value);
  loadedOnce = true;

  function parse<T>(key: string, fallback: T): T {
    const raw = map.get(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  return {
    tasks: parse<Task[]>(TASKS_KEY, []),
    notes: map.get(NOTES_KEY) ?? "",
    recurringTasks: parse<RecurringTask[]>(RECURRING_KEY, []),
    plans: parse<Plan[]>(PLANS_KEY, []),
    pointers: parse<Pointer[]>(POINTERS_KEY, []),
    futureTasks: parse<FutureTask[]>(FUTURE_KEY, []),
    scheduleSlots: parse<ScheduleSlots>(SCHEDULE_KEY, {}),
    mergedBoundaries: parse<number[]>(MERGED_BOUNDARIES_KEY, []),
    weekSchedule: parse<WeekSchedule | null>(WEEK_SCHEDULE_KEY, null),
    plansOverview: map.get(PLANS_OVERVIEW_KEY) ?? "",
    eisenhowerSlots: parse<EisenhowerSlots>(EISENHOWER_SLOTS_KEY, { ...EMPTY_EISENHOWER }),
    eisenhowerCrossed: parse<string[]>(EISENHOWER_CROSSED_KEY, []),
    quickNotes: parse<QuickNote[]>(QUICK_NOTES_KEY, []),
  };
}

// ── Individual save functions (fire-and-forget) ──

export function saveTasks(tasks: Task[]): void {
  dbSet(TASKS_KEY, JSON.stringify(tasks));
}

export function saveNotes(notes: string): void {
  dbSet(NOTES_KEY, notes);
}

export function saveRecurringTasks(tasks: RecurringTask[]): void {
  dbSet(RECURRING_KEY, JSON.stringify(tasks));
}

export function savePlans(plans: Plan[]): void {
  dbSet(PLANS_KEY, JSON.stringify(plans));
}

export function savePointers(pointers: Pointer[]): void {
  dbSet(POINTERS_KEY, JSON.stringify(pointers));
}

export function saveFutureTasks(tasks: FutureTask[]): void {
  dbSet(FUTURE_KEY, JSON.stringify(tasks));
}

export function saveWeekSchedule(week: WeekSchedule): void {
  dbSet(WEEK_SCHEDULE_KEY, JSON.stringify(week));
}

export function savePlansOverview(text: string): void {
  dbSet(PLANS_OVERVIEW_KEY, text);
}

export function saveEisenhowerSlots(slots: EisenhowerSlots): void {
  dbSet(EISENHOWER_SLOTS_KEY, JSON.stringify(slots));
}

export function saveEisenhowerCrossed(crossed: string[]): void {
  dbSet(EISENHOWER_CROSSED_KEY, JSON.stringify(crossed));
}

export function saveQuickNotes(notes: QuickNote[]): void {
  dbSet(QUICK_NOTES_KEY, JSON.stringify(notes));
}
