export type Status = "todo" | "progress" | "complete" | "blocked";

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

export interface Column {
  id: Status;
  label: string;
  color: string;
  accent: string;
  dotColor: string;
}

export const COLUMNS: Column[] = [
  { id: "todo",     label: "To Do",      color: "#eaeef2", accent: "#d0d7de", dotColor: "#57606a" },
  { id: "progress", label: "In Progress", color: "#fff8e1", accent: "#f9c513", dotColor: "#9a6700" },
  { id: "complete", label: "Complete",    color: "#f0fff4", accent: "#2da44e", dotColor: "#1a7f37" },
  { id: "blocked",  label: "Blocked",     color: "#fff0ef", accent: "#f85149", dotColor: "#cf222e" },
];
