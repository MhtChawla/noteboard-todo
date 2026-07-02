export type Status = "todo" | "progress" | "complete" | "blocked";

export interface IdeaCard {
  id: string;
  title: string;
  desc: string;
  createdAt: number;
}

export interface Plan {
  id: string;
  title: string;
  body: string;       // legacy
  goals: string;
  ideaCards: IdeaCard[];
  links: string;
  createdAt: number;
}

export interface Pointer {
  id: string;
  label: string;
  href: string;
}

export type RecurInterval = "1D" | "1W";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdAt: number;
  tags: string[];
}

export interface RecurringTask {
  id: string;
  title: string;
  interval: RecurInterval;
  createdAt: number;
}

export interface FutureTask {
  id: string;
  title: string;
  createdAt: number;
}

// hour (8–20) → array of task IDs scheduled in that slot
export type ScheduleSlots = Record<number, string[]>;

export type EisenhowerQuadrant = "do" | "schedule" | "delegate" | "eliminate";
export type EisenhowerSlots = Record<EisenhowerQuadrant, string[]>;

export interface Column {
  id: Status;
  label: string;
  color: string;
  accent: string;
  dotColor: string;
}

export const COLUMNS: Column[] = [
  { id: "todo",     label: "To Do",              color: "var(--col-todo-bg)", accent: "var(--col-todo-accent)", dotColor: "var(--col-todo-dot)" },
  { id: "progress", label: "In Progress",        color: "var(--col-progress-bg)", accent: "var(--col-progress-accent)", dotColor: "var(--col-progress-dot)" },
  { id: "complete", label: "Complete",           color: "var(--col-complete-bg)", accent: "var(--col-complete-accent)", dotColor: "var(--col-complete-dot)" },
  { id: "blocked",  label: "Blocked / Pick Later",color: "var(--col-blocked-bg)", accent: "var(--col-blocked-accent)", dotColor: "var(--col-blocked-dot)" },
];
