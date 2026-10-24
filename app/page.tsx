"use client";

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { Task, Plan, Status, COLUMNS, EisenhowerSlots, WeekSchedule, DaySchedule } from "@/lib/types";
import { loadAllData, saveTasks, savePlans, saveWeekSchedule, savePlansOverview, saveNotes, getSaveStatus, subscribeSaveStatus } from "@/lib/storage";
import { dateKey, nextDays, rolloverWeek, resetLeftovers } from "@/lib/week";
import Column from "@/components/Column";
import NotesPanel from "@/components/NotesPanel";
import ScheduleView from "@/components/ScheduleView";
import PlansView from "@/components/PlansView";
import TaskDetailPanel from "@/components/TaskDetailPanel";

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"tasks" | "plans" | "notes">("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansOverview, setPlansOverview] = useState("");
  const [notes, setNotes] = useState("");
  const [mounted, setMounted] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [devFont, setDevFont] = useState(true);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({});
  const [todayKey, setTodayKey] = useState(() => dateKey(new Date()));
  const weekRef = useRef<WeekSchedule>({});
  const [eisenhowerSlots, setEisenhowerSlots] = useState<EisenhowerSlots>({ do: [], schedule: [], delegate: [], eliminate: [] });
  const [eisenhowerCrossed, setEisenhowerCrossed] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dragTaskId = useRef<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const saveStatus = useSyncExternalStore(subscribeSaveStatus, getSaveStatus, () => "saved" as const);

  useEffect(() => {
    // If this fails, `mounted` stays false: no save effect runs, so an empty
    // board can never be written over the real one.
    loadAllData().then((data) => {
      const rawPlans = data.plans.map((p) => ({
        ...p,
        goals: p.goals ?? "",
        body: p.body ?? "",
        ideaCards: p.ideaCards ?? [],
        links: p.links ?? "",
      }));
      const storedFont = localStorage.getItem("devFont");
      const initialDevFont = storedFont !== "false";
      const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      const initialTheme = storedTheme ?? "light";
      // First run after the week view shipped: the old single-day schedule becomes today's
      const today = dateKey(new Date());
      const storedWeek = data.weekSchedule ?? {
        [today]: { slots: data.scheduleSlots, merged: data.mergedBoundaries },
      };
      const { schedule, leftoverIds } = rolloverWeek(storedWeek, today);
      React.startTransition(() => {
        setTasks(resetLeftovers(data.tasks, leftoverIds));
        setPlans(rawPlans);
        setPlansOverview(data.plansOverview);
        setNotes(data.notes);
        setTodayKey(today);
        setWeekSchedule(schedule);
        setEisenhowerSlots(data.eisenhowerSlots);
        setEisenhowerCrossed(data.eisenhowerCrossed);
        setMounted(true);
        setDevFont(initialDevFont);
        setTheme(initialTheme);
      });
    }).catch((err: Error) => setLoadError(err.message || "Unknown error"));
  }, [loadAttempt]);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted) saveTasks(tasks);
  }, [tasks, mounted]);

  useEffect(() => {
    if (mounted) savePlans(plans);
  }, [plans, mounted]);

  useEffect(() => {
    if (mounted) savePlansOverview(plansOverview);
  }, [plansOverview, mounted]);

  useEffect(() => {
    if (mounted) saveNotes(notes);
  }, [notes, mounted]);

  useEffect(() => {
    weekRef.current = weekSchedule;
    if (mounted) saveWeekSchedule(weekSchedule);
  }, [weekSchedule, mounted]);

  // Roll the week forward at midnight while the page stays open
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const today = dateKey(new Date());
      if (today === todayKey) return;
      const { schedule, leftoverIds } = rolloverWeek(weekRef.current, today);
      setTodayKey(today);
      setWeekSchedule(schedule);
      setTasks((prev) => resetLeftovers(prev, leftoverIds));
    }, 60_000);
    return () => clearInterval(id);
  }, [mounted, todayKey]);

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

  const updateDay = useCallback((day: string, fn: (d: DaySchedule) => DaySchedule) => {
    setWeekSchedule((prev) => ({ ...prev, [day]: fn(prev[day] ?? { slots: {}, merged: [] }) }));
  }, []);

  const onDropToSlot = useCallback((day: string, hour: number) => {
    if (!dragTaskId.current) return;
    const taskId = dragTaskId.current;
    dragTaskId.current = null;

    // move task to in-progress
    updateTask(taskId, { status: "progress" });

    // remove from any existing slot on any day, then add to the new slot
    setWeekSchedule((prev) => {
      const next: WeekSchedule = {};
      for (const [d, sched] of Object.entries(prev)) {
        const slots: Record<number, string[]> = {};
        for (const [h, ids] of Object.entries(sched.slots)) {
          slots[Number(h)] = ids.filter((id) => id !== taskId);
        }
        next[d] = { ...sched, slots };
      }
      const target = next[day] ?? { slots: {}, merged: [] };
      next[day] = { ...target, slots: { ...target.slots, [hour]: [...(target.slots[hour] ?? []), taskId] } };
      return next;
    });
  }, [updateTask]);

  const onCompleteSlot = useCallback((day: string, hours: number[]) => {
    const slots = weekSchedule[day]?.slots ?? {};
    hours.flatMap((h) => slots[h] ?? []).forEach((id) => updateTask(id, { status: "complete" }));
  }, [weekSchedule, updateTask]);

  const onMergeBoundary = useCallback((day: string, hour: number) => {
    updateDay(day, (d) => (d.merged.includes(hour) ? d : { ...d, merged: [...d.merged, hour].sort((a, b) => a - b) }));
  }, [updateDay]);

  const onUnmergeBoundary = useCallback((day: string, hour: number) => {
    updateDay(day, (d) => ({ ...d, merged: d.merged.filter((h) => h !== hour) }));
  }, [updateDay]);

  const onRemoveFromSlot = useCallback((day: string, hour: number, taskId: string) => {
    updateTask(taskId, { status: "todo" });
    updateDay(day, (d) => ({ ...d, slots: { ...d.slots, [hour]: (d.slots[hour] ?? []).filter((id) => id !== taskId) } }));
  }, [updateTask, updateDay]);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f6f8fa] p-4">
        {loadError ? (
          <div className="ui-sans max-w-sm w-full bg-white border border-[#d0d7de] rounded-lg p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-[#1f2328]">Couldn&apos;t load your board</p>
            <p className="text-xs text-[#57606a] mt-1.5 leading-relaxed">
              Your data is safe — nothing has been changed or saved. Check your connection and try again.
            </p>
            <p className="text-[10px] text-[#8c959f] mt-2 break-words">{loadError}</p>
            <button
              onClick={() => { setLoadError(null); setLoadAttempt((n) => n + 1); }}
              className="mt-4 text-xs font-medium px-4 py-1.5 rounded-md bg-[#1f2328] text-white hover:bg-[#2d333b] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="w-5 h-5 border-2 border-[#d0d7de] border-t-[#0969da] rounded-full animate-spin" />
        )}
      </div>
    );
  }

  const progressTasks = tasks.filter((t) => t.status !== "blocked");
  const totalTasks = progressTasks.length;
  const completedTasks = progressTasks.filter((t) => t.status === "complete").length;

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${theme === "dark" ? "dark bg-[#282a36] text-[#f8f8f2]" : "bg-[#f6f8fa]"} ${devFont ? "" : "font-default"}`}>
      {/* Main board */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-white border-b border-[#d0d7de] flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-2.5">
              <div className="w-6 h-6 md:w-7 md:h-7 bg-[#1f2328] rounded-lg flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="white" className="md:w-[14px] md:h-[14px]">
                  <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />
                </svg>
              </div>
              <h1 className="text-xs md:text-sm font-semibold text-[#1f2328] hidden sm:block">Noteboard</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 bg-[#f6f8fa] rounded-md p-0.5 border border-[#d0d7de]">
              <button
                onClick={() => { setActiveTab("tasks"); setSelectedTaskId(null); }}
                className={`px-2 md:px-3 py-1 text-[11px] md:text-xs font-medium rounded transition-colors ${activeTab === "tasks" && !selectedTaskId
                    ? "bg-white text-[#1f2328] shadow-sm"
                    : "text-[#57606a] hover:text-[#1f2328]"
                  }`}
              >
                Tasks
              </button>
              <button
                onClick={() => { setActiveTab("plans"); setSelectedTaskId(null); }}
                className={`px-2 md:px-3 py-1 text-[11px] md:text-xs font-medium rounded transition-colors ${activeTab === "plans"
                    ? "bg-white text-[#1f2328] shadow-sm"
                    : "text-[#57606a] hover:text-[#1f2328]"
                  }`}
              >
                Plans
              </button>
              <button
                onClick={() => { setActiveTab("notes"); setSelectedTaskId(null); }}
                className={`px-2 md:px-3 py-1 text-[11px] md:text-xs font-medium rounded transition-colors ${activeTab === "notes"
                    ? "bg-white text-[#1f2328] shadow-sm"
                    : "text-[#57606a] hover:text-[#1f2328]"
                  }`}
              >
                Notes
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {activeTab === "tasks" && (
              <>
                {/* Progress bar — hidden on mobile */}
                {totalTasks > 0 && (
                  <div className="hidden md:flex items-center gap-3">
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

                {/* Progress — mobile only (compact) */}
                {totalTasks > 0 && (
                  <span className="md:hidden text-[10px] text-[#57606a] tabular-nums font-medium">
                    {Math.round((completedTasks / totalTasks) * 100)}%
                  </span>
                )}

                {/* Schedule toggle — hidden on mobile */}
                <button
                  onClick={() => setScheduleMode((v) => !v)}
                  className={`ui-sans hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${scheduleMode
                      ? "bg-[#1f2328] text-white border-[#1f2328]"
                      : "bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa] hover:text-[#1f2328]"
                    }`}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z" />
                  </svg>
                  Schedule hourly/priorly
                </button>
              </>
            )}

            {/* Unsaved changes — only shown while a save is failing */}
            {saveStatus === "error" && (
              <span
                className="ui-sans flex items-center gap-1 text-[10px] md:text-[11px] font-medium text-[#cf222e] bg-[#ffebe9] border border-[#ffcecb] rounded-md px-2 py-1"
                title="Your last changes haven't reached the database yet. Retrying automatically — keep this tab open."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#cf222e] animate-pulse" />
                Not saved · retrying
              </span>
            )}

            {/* Theme Toggle Dot */}
            <button
              onClick={() => setTheme((t) => {
                const next = t === "light" ? "dark" : "light";
                localStorage.setItem("theme", next);
                return next;
              })}
              title={theme === "light" ? "Switch to Dark Mode (Dracula Theme)" : "Switch to Light Mode (Original)"}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === "light"
                  ? "bg-[#f1fa8c] border-[#f9c513] hover:scale-110 shadow-sm cursor-pointer"
                  : "bg-[#bd93f9] border-[#9b6ef3] hover:scale-110 shadow-md shadow-[#bd93f9]/20 cursor-pointer"
                }`}
            />

            {/* Font mode toggle — hidden on mobile */}
            <button
              onClick={() => setDevFont((v) => {
                const next = !v;
                localStorage.setItem("devFont", String(next));
                return next;
              })}
              title={devFont ? "Switch to default font" : "Switch to dev font (monospace)"}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-0 h-[29px] rounded-md border text-[11px] font-medium transition-colors ${devFont
                  ? "bg-[#1f2328] text-white border-[#1f2328]"
                  : "bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa]"
                }`}
              style={{ fontFamily: "Menlo, Monaco, monospace" }}
            >
              🧑‍💻 dev-mode
            </button>

            {/* Workspace toggle — mobile only */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className={`md:hidden w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${sidebarOpen
                  ? "bg-[#1f2328] text-white border-[#1f2328]"
                  : "text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa]"
                }`}
              title="Workspace"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5Z"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Plans tab */}
        {activeTab === "plans" && (
          <div className="flex-1 overflow-hidden">
            <PlansView plans={plans} onPlansChange={onPlansChange} overview={plansOverview} onOverviewChange={onOverviewChange} theme={theme} />
          </div>
        )}

        {/* Notes tab */}
        {activeTab === "notes" && (
          <div className="flex-1 overflow-hidden p-3 md:p-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="rough notes, thoughts, links, anything..."
              className="w-full h-full resize-none rounded-lg border border-[#e8d5a3] bg-[#fffef5] p-3 md:p-4 text-sm leading-relaxed placeholder:text-[#c4b078] focus:outline-none focus:ring-2 focus:ring-[#e0c96e] focus:border-transparent"
            />
          </div>
        )}

        {/* Board */}
        {activeTab === "tasks" && scheduleMode ? (
          <div className="ui-sans flex-1 flex overflow-hidden">
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
                week={weekSchedule}
                days={nextDays(todayKey, 7)}
                todayKey={todayKey}
                dragTaskId={dragTaskId}
                onDropToSlot={onDropToSlot}
                onRemoveFromSlot={onRemoveFromSlot}
                onCompleteSlot={onCompleteSlot}
                onMergeBoundary={onMergeBoundary}
                onUnmergeBoundary={onUnmergeBoundary}
                onUpdateTask={updateTask}
                onSelectTask={onSelectTask}
                eisenhowerSlots={eisenhowerSlots}
                eisenhowerCrossed={eisenhowerCrossed}
              />
            </div>
          </div>
        ) : activeTab === "tasks" ? (
          <div className="ui-sans flex-1 overflow-x-auto overflow-y-hidden">
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notes sidebar — always visible on desktop, slide-over on mobile */}
      <div className={`fixed md:static inset-y-0 right-0 z-50 h-full transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <NotesPanel onAddTask={addTask} plans={plans} onPlansChange={onPlansChange} theme={theme} />
      </div>
    </div>
  );
}
