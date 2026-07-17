import { supabase } from "./supabase";
import { Task, RecurringTask, Plan, Pointer, FutureTask, ScheduleSlots, EisenhowerSlots } from "./types";

const TASKS_KEY = "noteboard_tasks";
const NOTES_KEY = "noteboard_notes";
const RECURRING_KEY = "noteboard_recurring";
const PLANS_KEY = "noteboard_plans";
const POINTERS_KEY = "noteboard_pointers";
const FUTURE_KEY = "noteboard_future";
const SCHEDULE_KEY = "noteboard_schedule";
const MERGED_BOUNDARIES_KEY = "noteboard_merged_boundaries";
const PLANS_OVERVIEW_KEY = "noteboard_plans_overview";
const EISENHOWER_SLOTS_KEY = "noteboard_eisenhower_slots";
const EISENHOWER_CROSSED_KEY = "noteboard_eisenhower_crossed";

// Each deployment is scoped to one board (one user's data).
const BOARD_ID = process.env.NEXT_PUBLIC_BOARD_ID || "mohit";

async function dbSet(key: string, value: string): Promise<void> {
  await supabase
    .from("kv_store")
    .upsert({ board: BOARD_ID, key, value }, { onConflict: "board,key" });
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
  plansOverview: string;
  eisenhowerSlots: EisenhowerSlots;
  eisenhowerCrossed: string[];
}

const EMPTY_EISENHOWER: EisenhowerSlots = { do: [], schedule: [], delegate: [], eliminate: [] };

export async function loadAllData(): Promise<AllData> {
  const { data } = await supabase
    .from("kv_store")
    .select("key, value")
    .eq("board", BOARD_ID);
  const map = new Map<string, string>();
  if (data) {
    for (const row of data) map.set(row.key, row.value);
  }

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
    plansOverview: map.get(PLANS_OVERVIEW_KEY) ?? "",
    eisenhowerSlots: parse<EisenhowerSlots>(EISENHOWER_SLOTS_KEY, { ...EMPTY_EISENHOWER }),
    eisenhowerCrossed: parse<string[]>(EISENHOWER_CROSSED_KEY, []),
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

export function saveScheduleSlots(slots: ScheduleSlots): void {
  dbSet(SCHEDULE_KEY, JSON.stringify(slots));
}

export function saveMergedBoundaries(boundaries: number[]): void {
  dbSet(MERGED_BOUNDARIES_KEY, JSON.stringify(boundaries));
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
