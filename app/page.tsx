"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Task, Plan, Status, COLUMNS, ScheduleSlots } from "@/lib/types";
import { loadTasks, saveTasks, loadPlans, savePlans, loadScheduleSlots, saveScheduleSlots, loadMergedBoundaries, saveMergedBoundaries, loadPlansOverview, savePlansOverview } from "@/lib/storage";
import Column from "@/components/Column";
import NotesPanel from "@/components/NotesPanel";
import ScheduleView from "@/components/ScheduleView";
import PlansView from "@/components/PlansView";
import TaskDetailPanel from "@/components/TaskDetailPanel";

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"tasks" | "plans">("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansOverview, setPlansOverview] = useState("");
  const [mounted, setMounted] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlots>({});
  const [mergedBoundaries, setMergedBoundaries] = useState<number[]>([]);
  const dragTaskId = useRef<string | null>(null);

  useEffect(() => {
    const tasks = loadTasks();
    const slots = loadScheduleSlots();
    const boundaries = loadMergedBoundaries();
    const rawPlans = loadPlans().map((p) => ({
      ...p,
      goals: p.goals ?? "",
      body: p.body ?? "",
      ideaCards: p.ideaCards ?? [],
      links: p.links ?? "",
    }));
    const overview = loadPlansOverview();
    React.startTransition(() => {
      setTasks(tasks);
      setPlans(rawPlans);
      setPlansOverview(overview);
      setScheduleSlots(slots);
      setMergedBoundaries(boundaries);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (mounted) saveTasks(tasks);
  }, [tasks, mounted]);

  useEffect(() => {
    if (mounted) savePlans(plans);
  }, [plans, mounted]);

  useEffect(() => {
    if (mounted) savePlansOverview(plansOverview);
  }, [plansOverview, mounted]);

  const onPlansChange = useCallback((next: Plan[]) => setPlans(next), []);
  const onOverviewChange = useCallback((text: string) => setPlansOverview(text), []);
  const onSelectTask = useCallback((id: string) => { setSelectedTaskId(id); setActiveTab("tasks"); }, []);

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

  const deleteAllTasks = useCallback((status: Status) => {
    setTasks((prev) => prev.filter((t) => t.status !== status));
  }, []);

  const onDragStart = useCallback((taskId: string) => {
    dragTaskId.current = taskId;
  }, []);

  const onDrop = useCallback((targetStatus: Status) => {
    if (!dragTaskId.current) return;
    updateTask(dragTaskId.current, { status: targetStatus });
    dragTaskId.current = null;
  }, [updateTask]);

  const onDropToSlot = useCallback((hour: number) => {
    if (!dragTaskId.current) return;
    const taskId = dragTaskId.current;
    dragTaskId.current = null;

    // move task to in-progress
    updateTask(taskId, { status: "progress" });

    // remove from any existing slot, then add to new slot
    setScheduleSlots((prev) => {
      const next: ScheduleSlots = {};
      for (const [h, ids] of Object.entries(prev)) {
        next[Number(h)] = (ids as string[]).filter((id) => id !== taskId);
      }
      next[hour] = [...(next[hour] ?? []), taskId];
      saveScheduleSlots(next);
      return next;
    });
  }, [updateTask]);

  const onCompleteSlot = useCallback((hour: number) => {
    const ids = scheduleSlots[hour] ?? [];
    ids.forEach((id) => updateTask(id, { status: "complete" }));
  }, [scheduleSlots, updateTask]);

  const onMergeBoundary = useCallback((hour: number) => {
    setMergedBoundaries((prev) => {
      if (prev.includes(hour)) return prev;
      const next = [...prev, hour].sort((a, b) => a - b);
      saveMergedBoundaries(next);
      return next;
    });
  }, []);

  const onUnmergeBoundary = useCallback((hour: number) => {
    setMergedBoundaries((prev) => {
      const next = prev.filter((h) => h !== hour);
      saveMergedBoundaries(next);
      return next;
    });
  }, []);

  const onRemoveFromSlot = useCallback((hour: number, taskId: string) => {
    updateTask(taskId, { status: "todo" });
    setScheduleSlots((prev) => {
      const next = { ...prev, [hour]: (prev[hour] ?? []).filter((id) => id !== taskId) };
      saveScheduleSlots(next);
      return next;
    });
  }, [updateTask]);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f6f8fa]">
        <div className="w-5 h-5 border-2 border-[#d0d7de] border-t-[#0969da] rounded-full animate-spin" />
      </div>
    );
  }

  const progressTasks = tasks.filter((t) => t.status !== "blocked");
  const totalTasks = progressTasks.length;
  const completedTasks = progressTasks.filter((t) => t.status === "complete").length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fa]">
      {/* Main board */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#d0d7de] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#1f2328] rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
                  <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"/>
                </svg>
              </div>
              <h1 className="text-sm font-semibold text-[#1f2328]">Noteboard</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 bg-[#f6f8fa] rounded-md p-0.5 border border-[#d0d7de]">
              <button
                onClick={() => { setActiveTab("tasks"); setSelectedTaskId(null); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === "tasks" && !selectedTaskId
                    ? "bg-white text-[#1f2328] shadow-sm"
                    : "text-[#57606a] hover:text-[#1f2328]"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => { setActiveTab("plans"); setSelectedTaskId(null); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === "plans"
                    ? "bg-white text-[#1f2328] shadow-sm"
                    : "text-[#57606a] hover:text-[#1f2328]"
                }`}
              >
                Plans
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "tasks" && (
              <>
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

                {/* Schedule toggle */}
                <button
                  onClick={() => setScheduleMode((v) => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                    scheduleMode
                      ? "bg-[#1f2328] text-white border-[#1f2328]"
                      : "bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa] hover:text-[#1f2328]"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/>
                  </svg>
                  Schedule hour-wise
                </button>
              </>
            )}
          </div>
        </header>

        {/* Plans tab */}
        {activeTab === "plans" && (
          <div className="flex-1 overflow-hidden">
            <PlansView plans={plans} onPlansChange={onPlansChange} overview={plansOverview} onOverviewChange={onOverviewChange} />
          </div>
        )}

        {/* Board */}
        {activeTab === "tasks" && scheduleMode ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Todo column */}
            <div className="flex flex-col w-72 flex-shrink-0 h-full border-r border-[#d0d7de] overflow-y-auto p-4">
              {COLUMNS.filter((c) => c.id === "todo").map((col) => (
                <Column
                  key={col.id}
                  column={col}
                  tasks={tasks.filter((t) => t.status === col.id)}
                  onAddTask={addTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onDeleteAllTasks={deleteAllTasks}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  onSelectTask={onSelectTask}
                />
              ))}
            </div>

            {/* Schedule slots */}
            <div className="flex-1 overflow-hidden">
              <ScheduleView
                tasks={tasks}
                slots={scheduleSlots}
                dragTaskId={dragTaskId}
                mergedBoundaries={mergedBoundaries}
                onDropToSlot={onDropToSlot}
                onRemoveFromSlot={onRemoveFromSlot}
                onCompleteSlot={onCompleteSlot}
                onMergeBoundary={onMergeBoundary}
                onUnmergeBoundary={onUnmergeBoundary}
                onSelectTask={onSelectTask}
              />
            </div>
          </div>
        ) : activeTab === "tasks" ? (
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
                      onDeleteAllTasks={deleteAllTasks}
                      onDragStart={onDragStart}
                      onDrop={onDrop}
                      onSelectTask={onSelectTask}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Task detail drawer — overlays the board */}
        {activeTab === "tasks" && (
          <TaskDetailPanel
            task={tasks.find((t) => t.id === selectedTaskId) ?? null}
            onUpdate={updateTask}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>

      {/* Notes sidebar — always visible */}
      <NotesPanel onAddTask={addTask} plans={plans} onPlansChange={onPlansChange} />
    </div>
  );
}
