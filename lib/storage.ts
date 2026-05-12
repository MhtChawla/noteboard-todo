import { Task, RecurringTask, Plan, Pointer, FutureTask } from "./types";

const TASKS_KEY = "noteboard_tasks";
const NOTES_KEY = "noteboard_notes";
const RECURRING_KEY = "noteboard_recurring";
const PLANS_KEY = "noteboard_plans";
const POINTERS_KEY = "noteboard_pointers";

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadNotes(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NOTES_KEY) ?? "";
}

export function saveNotes(notes: string): void {
  localStorage.setItem(NOTES_KEY, notes);
}

export function loadRecurringTasks(): RecurringTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecurringTasks(tasks: RecurringTask[]): void {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(tasks));
}

export function loadPlans(): Plan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlans(plans: Plan[]): void {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function loadPointers(): Pointer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(POINTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePointers(pointers: Pointer[]): void {
  localStorage.setItem(POINTERS_KEY, JSON.stringify(pointers));
}

const FUTURE_KEY = "noteboard_future";

export function loadFutureTasks(): FutureTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUTURE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFutureTasks(tasks: FutureTask[]): void {
  localStorage.setItem(FUTURE_KEY, JSON.stringify(tasks));
}
