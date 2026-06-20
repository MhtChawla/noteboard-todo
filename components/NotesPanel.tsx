"use client";

import { useState } from "react";
import { loadPointers, savePointers, loadFutureTasks, saveFutureTasks } from "@/lib/storage";
import { Plan, IdeaCard, Pointer, FutureTask, Status } from "@/lib/types";
import RecurringTasksPanel from "./RecurringTasksPanel";

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Convert HTML (from contenteditable) to plain text for textarea display */
function htmlToPlain(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

interface Props {
  onAddTask: (status: Status, title: string, description: string) => void;
  plans: Plan[];
  onPlansChange: (plans: Plan[]) => void;
  theme?: "light" | "dark";
}

export default function NotesPanel({ onAddTask, plans, onPlansChange, theme = "light" }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<"plans" | "pointers" | "recurring">("recurring");

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [quickIdea, setQuickIdea] = useState<Record<string, { title: string; desc: string }>>({});

  const [pointers, setPointers] = useState<Pointer[]>(loadPointers);
  const [newPtrLabel, setNewPtrLabel] = useState("");
  const [newPtrHref, setNewPtrHref] = useState("");

  const [futureTasks, setFutureTasks] = useState<FutureTask[]>(loadFutureTasks);
  const [newFutureTitle, setNewFutureTitle] = useState("");

  function addPlan() {
    const title = newPlanTitle.trim();
    if (!title) return;
    onPlansChange([{ id: genId(), title, body: "", goals: "", ideaCards: [], links: "", createdAt: Date.now() }, ...plans]);
    setNewPlanTitle("");
  }

  function deletePlan(id: string) {
    onPlansChange(plans.filter((p) => p.id !== id));
    if (expandedPlan === id) setExpandedPlan(null);
  }

  function dropIdea(planId: string) {
    const title = (quickIdea[planId]?.title ?? "").trim();
    if (!title) return;
    const card: IdeaCard = { id: `card_${Date.now()}`, title, desc: quickIdea[planId]?.desc ?? "", createdAt: Date.now() };
    onPlansChange(plans.map((p) =>
      p.id === planId ? { ...p, ideaCards: [...(p.ideaCards ?? []), card] } : p
    ));
    setQuickIdea((prev) => ({ ...prev, [planId]: { title: "", desc: "" } }));
  }

  function addFutureTask() {
    const title = newFutureTitle.trim();
    if (!title) return;
    const task: FutureTask = { id: genId(), title, createdAt: Date.now() };
    const updated = [task, ...futureTasks];
    setFutureTasks(updated);
    saveFutureTasks(updated);
    setNewFutureTitle("");
  }

  function promoteFutureTask(task: FutureTask) {
    onAddTask("todo", task.title, "");
    const updated = futureTasks.filter((t) => t.id !== task.id);
    setFutureTasks(updated);
    saveFutureTasks(updated);
  }

  function deleteFutureTask(id: string) {
    const updated = futureTasks.filter((t) => t.id !== id);
    setFutureTasks(updated);
    saveFutureTasks(updated);
  }

  function addPointer() {
    const label = newPtrLabel.trim();
    if (!label) return;
    const updated = [...pointers, { id: genId(), label, href: newPtrHref.trim() }];
    setPointers(updated);
    savePointers(updated);
    setNewPtrLabel("");
    setNewPtrHref("");
  }

  function deletePointer(id: string) {
    const updated = pointers.filter((p) => p.id !== id);
    setPointers(updated);
    savePointers(updated);
  }

  const TAB_LABELS = [
    { key: "recurring" as const, label: "Recurring" },
    { key: "plans" as const, label: "Plans" },
    { key: "pointers" as const, label: "Pointers" },
  ];

  return (
    <div
      className="ui-sans flex flex-col bg-white border-l border-[#d0d7de] transition-all duration-200"
      style={{ width: collapsed ? "44px" : "260px", minWidth: collapsed ? "44px" : "260px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#d0d7de] flex-shrink-0">
        {!collapsed && (
          <span className="text-xs font-semibold text-[#1f2328]">Workspace</span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa] rounded-md p-1 transition-colors flex-shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"/>
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#d0d7de] flex-shrink-0">
            {TAB_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 text-[10px] font-medium py-1.5 transition-colors ${
                  tab === key
                    ? "text-[#0969da] border-b-2 border-[#0969da]"
                    : "text-[#57606a] hover:text-[#1f2328]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Plans tab */}
          {tab === "plans" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Add plan */}
              <div className="flex gap-1 p-2 border-b border-[#d0d7de] flex-shrink-0">
                <input
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlan()}
                  placeholder="New plan…"
                  className="flex-1 text-xs px-2 py-1 border border-[#d0d7de] rounded-md focus:outline-none focus:border-[#0969da]"
                />
                <button
                  onClick={addPlan}
                  className="text-xs px-2 py-1 bg-[#1f2328] text-white rounded-md hover:bg-[#2d3748] transition-colors"
                >
                  +
                </button>
              </div>

              {/* Plan list */}
              <div className="flex-1 overflow-y-auto">
                {plans.length === 0 && (
                  <p className="text-[11px] text-[#8c959f] p-3 text-center">No plans yet</p>
                )}
                {plans.map((plan) => (
                  <div key={plan.id} className="border-b border-[#f0f0f0] last:border-0">
                    {/* Plan row */}
                    <div className="flex items-center gap-1 px-2 py-2 group">
                      <button
                        onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                        className="flex-1 text-left text-xs font-medium text-[#1f2328] truncate"
                      >
                        <span className="text-[#8c959f] mr-1">{expandedPlan === plan.id ? "▾" : "▸"}</span>
                        {plan.title}
                      </button>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#cf222e] hover:text-[#a40e26] text-[10px] px-1 transition-opacity"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>

                    {/* Expanded — quick idea drop */}
                    {expandedPlan === plan.id && (
                      <div className="px-2 pb-2 flex flex-col gap-1.5">
                        {(plan.ideaCards ?? []).length > 0 && (
                          <p className="text-[10px] text-[#8c959f] px-1">
                            {plan.ideaCards.length} idea{plan.ideaCards.length !== 1 ? "s" : ""} — open Plans tab to view
                          </p>
                        )}
                        <div className="flex flex-col gap-1">
                          <input
                            autoFocus
                            value={quickIdea[plan.id]?.title ?? ""}
                            onChange={(e) => setQuickIdea((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], title: e.target.value, desc: prev[plan.id]?.desc ?? "" } }))}
                            onKeyDown={(e) => { if (e.key === "Enter") dropIdea(plan.id); }}
                            placeholder="Idea title..."
                            className="w-full text-xs px-2 py-1.5 border border-[#d0d7de] rounded-md focus:outline-none focus:border-[#f9c513] transition-colors placeholder-[#8c959f]"
                          />
                          <textarea
                            value={quickIdea[plan.id]?.desc ?? ""}
                            onChange={(e) => setQuickIdea((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], title: prev[plan.id]?.title ?? "", desc: e.target.value } }))}
                            placeholder="Description (optional)..."
                            rows={2}
                            className="w-full text-xs px-2 py-1.5 border border-[#d0d7de] rounded-md focus:outline-none focus:border-[#f9c513] transition-colors placeholder-[#8c959f] resize-none"
                          />
                          <button
                            onClick={() => dropIdea(plan.id)}
                            className="w-full text-xs py-1.5 bg-[#1f2328] text-white rounded-md hover:bg-[#2d333b] transition-colors font-medium"
                          >
                            Drop idea
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pointers tab */}
          {tab === "pointers" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Add pointer */}
              <div className="flex flex-col gap-1 p-2 border-b border-[#d0d7de] flex-shrink-0">
                <input
                  value={newPtrLabel}
                  onChange={(e) => setNewPtrLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPointer()}
                  placeholder="Label…"
                  className="text-xs px-2 py-1 border border-[#d0d7de] rounded-md focus:outline-none focus:border-[#0969da]"
                />
                <div className="flex gap-1">
                  <input
                    value={newPtrHref}
                    onChange={(e) => setNewPtrHref(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPointer()}
                    placeholder="URL or note (optional)"
                    className="flex-1 text-xs px-2 py-1 border border-[#d0d7de] rounded-md focus:outline-none focus:border-[#0969da]"
                  />
                  <button
                    onClick={addPointer}
                    className="text-xs px-2 py-1 bg-[#1f2328] text-white rounded-md hover:bg-[#2d3748] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Pointer list */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {pointers.length === 0 && (
                  <p className="text-[11px] text-[#8c959f] text-center mt-4">No pointers yet</p>
                )}
                {pointers.map((ptr) => (
                  <div key={ptr.id} className="flex items-center gap-1 group py-0.5">
                    <span className="text-[#0969da] text-[10px] flex-shrink-0">→</span>
                    {ptr.href && ptr.href.startsWith("http") ? (
                      <a
                        href={ptr.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-xs text-[#0969da] underline truncate hover:text-[#0550ae]"
                        title={ptr.href}
                      >
                        {ptr.label}
                      </a>
                    ) : (
                      <span className="flex-1 text-xs text-[#1f2328] truncate" title={ptr.href || undefined}>
                        {ptr.label}
                        {ptr.href && <span className="text-[#8c959f] ml-1">— {ptr.href}</span>}
                      </span>
                    )}
                    <button
                      onClick={() => deletePointer(ptr.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#cf222e] text-[10px] px-0.5 transition-opacity"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring tab */}
          {tab === "recurring" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Recurring — top 50% */}
              <div className="flex flex-col overflow-hidden" style={{ height: "50%" }}>
                <RecurringTasksPanel onAddTask={onAddTask} />
              </div>

              {/* Future Tasks — bottom 50% */}
              <div className="flex flex-col overflow-hidden border-t border-[#d0d7de]" style={{ height: "50%" }}>
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#d0d7de] flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="#57606a">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/>
                  </svg>
                  <span className="text-xs font-semibold text-[#1f2328]">Future Tasks</span>
                </div>

                {/* Input row */}
                <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[#d0d7de] flex-shrink-0">
                  <input
                    value={newFutureTitle}
                    onChange={(e) => setNewFutureTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFutureTask()}
                    placeholder="Task title…"
                    className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-[#1f2328] placeholder-[#8c959f] focus:outline-none focus:border-[#0969da] focus:bg-white transition-colors"
                  />
                  <button
                    onClick={addFutureTask}
                    disabled={!newFutureTitle.trim()}
                    className="text-[10px] font-semibold px-2 py-1.5 rounded-md bg-[#6e40c9] text-white border border-[#6e40c9] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#5a32a3] transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                  {futureTasks.length === 0 ? (
                    <p className="text-[10px] text-[#8c959f] px-3 pt-3">No future tasks yet.</p>
                  ) : (
                    <ul className="divide-y divide-[#f0f0f0]">
                      {futureTasks.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center gap-2 px-2.5 py-2 group cursor-pointer hover:bg-[#f6f8fa] transition-colors"
                          onClick={() => promoteFutureTask(t)}
                          title="Click to move to To Do"
                        >
                          <span className="flex-1 text-[11px] text-[#1f2328] truncate">{t.title}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteFutureTask(t.id); }}
                            title="Remove"
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
            </div>
          )}
        </div>
      )}

      {collapsed && (
        <div className="flex flex-col items-center pt-4 gap-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#adb5bd">
            <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5Z"/>
          </svg>
        </div>
      )}
    </div>
  );
}
