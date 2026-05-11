"use client";

import { useState } from "react";
import { RecurringTask, RecurInterval, Status } from "@/lib/types";
import { loadRecurringTasks, saveRecurringTasks } from "@/lib/storage";

function generateId() {
  return `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface Props {
  onAddTask: (status: Status, title: string, description: string) => void;
}

export default function RecurringTasksPanel({ onAddTask }: Props) {
  const [items, setItems] = useState<RecurringTask[]>(loadRecurringTasks);
  const [input, setInput] = useState("");
  const [interval, setInterval] = useState<RecurInterval>("1D");

  function add() {
    const title = input.trim();
    if (!title) return;
    const task: RecurringTask = { id: generateId(), title, interval, createdAt: Date.now() };
    const next = [task, ...items];
    setItems(next);
    saveRecurringTasks(next);
    onAddTask("todo", title, "");
    setInput("");
  }

  function remove(id: string) {
    const next = items.filter((t) => t.id !== id);
    setItems(next);
    saveRecurringTasks(next);
  }

  function reAdd(task: RecurringTask) {
    onAddTask("todo", task.title, "");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#d0d7de] flex-shrink-0">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="#57606a">
          <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/>
        </svg>
        <span className="text-xs font-semibold text-[#1f2328]">Recurring Tasks</span>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[#d0d7de] flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Task title…"
          className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-[#1f2328] placeholder-[#8c959f] focus:outline-none focus:border-[#0969da] focus:bg-white transition-colors"
        />
        <div className="flex gap-1 flex-shrink-0">
          {(["1D", "1W"] as RecurInterval[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setInterval(opt)}
              className={`text-[10px] font-semibold px-2 py-1.5 rounded-md border transition-colors ${
                interval === opt
                  ? "bg-[#0969da] text-white border-[#0969da]"
                  : "bg-[#f6f8fa] text-[#57606a] border-[#d0d7de] hover:bg-[#eaeef2]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          onClick={add}
          disabled={!input.trim()}
          className="text-[10px] font-semibold px-2 py-1.5 rounded-md bg-[#2da44e] text-white border border-[#2da44e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2c974b] transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-[10px] text-[#8c959f] px-3 pt-3">No recurring tasks yet.</p>
        ) : (
          <ul className="divide-y divide-[#f0f0f0]">
            {items.map((t) => (
              <li key={t.id} className="flex items-center gap-2 px-2.5 py-2 group">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    t.interval === "1D"
                      ? "bg-[#fff8e1] text-[#9a6700]"
                      : "bg-[#f0f8ff] text-[#0969da]"
                  }`}
                >
                  {t.interval}
                </span>
                <span className="flex-1 text-[11px] text-[#1f2328] truncate">{t.title}</span>
                <button
                  onClick={() => reAdd(t)}
                  title="Add to board now"
                  className="opacity-0 group-hover:opacity-100 text-[#57606a] hover:text-[#0969da] transition-all p-0.5 rounded"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
                  </svg>
                </button>
                <button
                  onClick={() => remove(t.id)}
                  title="Remove recurring task"
                  className="opacity-0 group-hover:opacity-100 text-[#57606a] hover:text-[#cf222e] transition-all p-0.5 rounded"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
