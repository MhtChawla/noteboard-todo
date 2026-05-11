"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task, Status, COLUMNS } from "@/lib/types";
import { loadTasks, saveTasks } from "@/lib/storage";
import Column from "@/components/Column";
import NotesPanel from "@/components/NotesPanel";

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const dragTaskId = useRef<string | null>(null);

  useEffect(() => {
    setTasks(loadTasks());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveTasks(tasks);
  }, [tasks, mounted]);

  const addTask = useCallback((status: Status, title: string, description: string) => {
    const task: Task = {
      id: generateId(),
      title,
      description,
      status,
      createdAt: Date.now(),
      tags: [],
    };
    setTasks((prev) => [task, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const onDragStart = useCallback((taskId: string) => {
    dragTaskId.current = taskId;
  }, []);

  const onDrop = useCallback((targetStatus: Status) => {
    if (!dragTaskId.current) return;
    updateTask(dragTaskId.current, { status: targetStatus });
    dragTaskId.current = null;
  }, [updateTask]);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f6f8fa]">
        <div className="w-5 h-5 border-2 border-[#d0d7de] border-t-[#0969da] rounded-full animate-spin" />
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "complete").length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fa]">
      {/* Main board */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#d0d7de] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#1f2328] rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
                <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#1f2328]">Noteboard</h1>
              <p className="text-[11px] text-[#57606a]">
                {completedTasks}/{totalTasks} tasks completed
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-[#eaeef2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2da44e] rounded-full transition-all duration-500"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#57606a] tabular-nums">
                {Math.round((completedTasks / totalTasks) * 100)}%
              </span>
            </div>
          )}
        </header>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: "fit-content" }}>
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col w-64 flex-shrink-0 h-full">
                <div className="flex-1 overflow-y-auto pr-0.5">
                  <Column
                    column={col}
                    tasks={tasks.filter((t) => t.status === col.id)}
                    onAddTask={addTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes sidebar */}
      <NotesPanel onAddTask={addTask} />
    </div>
  );
}
