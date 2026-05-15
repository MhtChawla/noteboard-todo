"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plan } from "@/lib/types";
import { loadPlans, savePlans } from "@/lib/storage";

function generateId() {
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function PlansView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const loaded = loadPlans();
    React.startTransition(() => {
      setPlans(loaded);
      if (loaded.length > 0) setActivePlanId(loaded[0].id);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (mounted) savePlans(plans);
  }, [plans, mounted]);

  const activePlan = plans.find((p) => p.id === activePlanId) ?? null;

  const addPlan = useCallback(() => {
    const title = newTitle.trim();
    if (!title) return;
    const plan: Plan = { id: generateId(), title, body: "", createdAt: Date.now() };
    setPlans((prev) => [plan, ...prev]);
    setActivePlanId(plan.id);
    setNewTitle("");
    setAddingNew(false);
  }, [newTitle]);

  const updateBody = useCallback((id: string, body: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, body } : p)));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activePlanId === id) setActivePlanId(next[0]?.id ?? null);
      return next;
    });
  }, [activePlanId]);

  if (!mounted) return null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-[#d0d7de] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[#d0d7de] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#57606a] uppercase tracking-wider">Plans</span>
          <button
            onClick={() => { setAddingNew(true); setNewTitle(""); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f6f8fa] text-[#57606a] hover:text-[#1f2328] transition-colors"
            title="New plan"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
            </svg>
          </button>
        </div>

        {/* New plan input */}
        {addingNew && (
          <div className="px-3 py-2 border-b border-[#d0d7de]">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addPlan();
                if (e.key === "Escape") setAddingNew(false);
              }}
              placeholder="Plan name..."
              className="w-full text-sm px-2 py-1.5 rounded border border-[#0969da] outline-none text-[#1f2328] placeholder-[#8c959f]"
            />
            <div className="flex gap-1 mt-1.5">
              <button
                onClick={addPlan}
                className="flex-1 text-xs py-1 bg-[#1f2328] text-white rounded hover:bg-[#2d333b] transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setAddingNew(false)}
                className="flex-1 text-xs py-1 border border-[#d0d7de] text-[#57606a] rounded hover:bg-[#f6f8fa] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto">
          {plans.length === 0 && !addingNew && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-[#8c959f]">No plans yet.</p>
              <button
                onClick={() => setAddingNew(true)}
                className="mt-2 text-xs text-[#0969da] hover:underline"
              >
                Create your first plan
              </button>
            </div>
          )}
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className={`w-full text-left px-4 py-2.5 border-b border-[#f0f2f4] transition-colors group flex items-center justify-between gap-2 ${
                plan.id === activePlanId
                  ? "bg-[#f6f8fa] text-[#1f2328]"
                  : "hover:bg-[#f6f8fa] text-[#57606a]"
              }`}
            >
              <span className="text-sm truncate font-medium">{plan.title}</span>
              <span
                onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex-shrink-0 text-[#8c959f] hover:text-[#cf222e] transition-all cursor-pointer"
                title="Delete plan"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail / brainstorm area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f8fa]">
        {activePlan ? (
          <>
            {/* Plan header */}
            <div className="px-8 pt-6 pb-3 flex-shrink-0">
              <input
                value={activePlan.title}
                onChange={(e) => updateTitle(activePlan.id, e.target.value)}
                className="w-full text-2xl font-semibold text-[#1f2328] bg-transparent outline-none border-none placeholder-[#8c959f]"
                placeholder="Plan title"
              />
              <p className="text-xs text-[#8c959f] mt-1">
                Created {new Date(activePlan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* Divider */}
            <div className="mx-8 border-t border-[#d0d7de]" />

            {/* Body / brainstorm textarea */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              <textarea
                value={activePlan.body}
                onChange={(e) => updateBody(activePlan.id, e.target.value)}
                placeholder={`Brainstorm, outline ideas, track progress for "${activePlan.title}"...\n\nYou can jot down:\n• Goals & milestones\n• Ideas & concepts\n• Links and references\n• Action items`}
                className="w-full h-full min-h-[400px] bg-white border border-[#d0d7de] rounded-lg p-4 text-sm text-[#1f2328] placeholder-[#8c959f] outline-none resize-none focus:border-[#0969da] transition-colors leading-relaxed"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#eaeef2] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="#57606a">
                  <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
                </svg>
              </div>
              <p className="text-sm text-[#57606a]">Select a plan to start brainstorming</p>
              <button
                onClick={() => setAddingNew(true)}
                className="mt-3 text-sm text-[#0969da] hover:underline"
              >
                or create a new plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
