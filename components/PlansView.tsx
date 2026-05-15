"use client";

import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import { Plan, IdeaCard } from "@/lib/types";

function generateId() {
  return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Rich editor with Google-Docs-style link insertion ───────────────────────
function RichEditor({
  value,
  onChange,
  placeholder,
  grow,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  grow?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // phase: null = hidden | "icon" = show link icon | "input" = show url input
  const [phase, setPhase] = useState<null | "icon" | "input">(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");

  const isFocused = useRef(false);

  useLayoutEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external updates (e.g. side panel edits) into DOM when not focused
  useLayoutEffect(() => {
    if (!isFocused.current && editorRef.current) {
      const current = editorRef.current.innerHTML;
      if (current !== value) editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !editorRef.current || !containerRef.current) {
      setPhase(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setPhase(null);
      return;
    }
    savedRange.current = range.cloneRange();
    const selRect = range.getBoundingClientRect();
    const cRect = containerRef.current.getBoundingClientRect();
    setPos({
      top: selRect.top - cRect.top - 38,
      left: selRect.left - cRect.left + selRect.width / 2,
    });
    setPhase("icon");
  }, []);

  const openInput = useCallback(() => {
    setPhase("input");
    setLinkUrl("");
    // focus the input after render
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }, []);

  const insertLink = useCallback(() => {
    let url = linkUrl.trim();
    if (!url || !savedRange.current) { setPhase(null); return; }
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;

    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
    document.execCommand("createLink", false, url);
    editorRef.current?.querySelectorAll("a").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    setPhase(null);
    setLinkUrl("");
    savedRange.current = null;
  }, [linkUrl, onChange]);

  const dismiss = useCallback(() => { setPhase(null); setLinkUrl(""); }, []);

  return (
    <div ref={containerRef} className={`relative ${grow ? "flex-1 flex flex-col min-h-0" : ""}`}>

      {/* Phase 1 — link icon pill */}
      {phase === "icon" && (
        <div
          style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
          className="absolute z-50 bg-[#1f2328] rounded-md shadow-lg flex items-center"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={openInput}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-white hover:bg-white/10 rounded-md transition-colors"
            title="Add link"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 2 2 0 0 0 2.83 0l2.5-2.5a2 2 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a2 2 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 2 2 0 0 0-2.83 0l-2.5 2.5a2 2 0 0 0 0 2.83Z" />
            </svg>
            <span className="text-xs">Link</span>
          </button>
        </div>
      )}

      {/* Phase 2 — URL input popover */}
      {phase === "input" && (
        <div
          style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
          className="absolute z-50 bg-white border border-[#d0d7de] rounded-lg shadow-xl p-3 flex flex-col gap-2 w-72"
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="text-[11px] font-medium text-[#57606a] uppercase tracking-wide">Add link</p>
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") insertLink();
              if (e.key === "Escape") dismiss();
            }}
            placeholder="Paste or type a URL..."
            className="w-full text-sm px-2.5 py-1.5 rounded-md border border-[#d0d7de] outline-none focus:border-[#0969da] text-[#1f2328] placeholder-[#8c959f]"
          />
          <div className="flex gap-1.5">
            <button
              onClick={insertLink}
              className="flex-1 text-xs py-1.5 bg-[#0969da] text-white rounded-md hover:bg-[#0860ca] transition-colors font-medium"
            >
              Apply
            </button>
            <button
              onClick={dismiss}
              className="flex-1 text-xs py-1.5 border border-[#d0d7de] text-[#57606a] rounded-md hover:bg-[#f6f8fa] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        className={`outline-none text-sm text-[#1f2328] leading-relaxed ${grow ? "flex-1 overflow-y-auto" : ""}`}
      />
    </div>
  );
}

function genCardId() {
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Main Plans view ──────────────────────────────────────────────────────────
export default function PlansView({ plans, onPlansChange }: { plans: Plan[]; onPlansChange: (plans: Plan[]) => void }) {
  const [activePlanId, setActivePlanId] = useState<string | null>(() => plans[0]?.id ?? null);
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0] ?? null;

  const updatePlan = useCallback((id: string, updates: Partial<Plan>) => {
    onPlansChange(plans.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [plans, onPlansChange]);

  const addPlan = useCallback(() => {
    const title = newTitle.trim();
    if (!title) return;
    const plan: Plan = { id: generateId(), title, body: "", goals: "", ideaCards: [], links: "", createdAt: Date.now() };
    onPlansChange([plan, ...plans]);
    setActivePlanId(plan.id);
    setNewTitle("");
    setAddingNew(false);
  }, [newTitle, plans, onPlansChange]);

  const deletePlan = useCallback((id: string) => {
    const next = plans.filter((p) => p.id !== id);
    onPlansChange(next);
    if (activePlanId === id) setActivePlanId(next[0]?.id ?? null);
  }, [plans, onPlansChange, activePlanId]);

  // ── IdeaCard helpers ──
  const addIdeaCard = useCallback((planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const card: IdeaCard = { id: genCardId(), title: "", desc: "", createdAt: Date.now() };
    updatePlan(planId, { ideaCards: [...(plan.ideaCards ?? []), card] });
  }, [plans, updatePlan]);

  const updateIdeaCard = useCallback((planId: string, cardId: string, updates: Partial<IdeaCard>) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    updatePlan(planId, {
      ideaCards: (plan.ideaCards ?? []).map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
    });
  }, [plans, updatePlan]);

  const deleteIdeaCard = useCallback((planId: string, cardId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    updatePlan(planId, { ideaCards: (plan.ideaCards ?? []).filter((c) => c.id !== cardId) });
  }, [plans, updatePlan]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-60 flex-shrink-0 border-r border-[#d0d7de] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[#d0d7de] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#57606a] uppercase tracking-wider">Plans</span>
          <button
            onClick={() => { setAddingNew(true); setNewTitle(""); }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f6f8fa] text-[#57606a] hover:text-[#1f2328] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
            </svg>
          </button>
        </div>

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
              <button onClick={addPlan} className="flex-1 text-xs py-1 bg-[#1f2328] text-white rounded hover:bg-[#2d333b] transition-colors">Add</button>
              <button onClick={() => setAddingNew(false)} className="flex-1 text-xs py-1 border border-[#d0d7de] text-[#57606a] rounded hover:bg-[#f6f8fa] transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {plans.length === 0 && !addingNew && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-[#8c959f]">No plans yet.</p>
              <button onClick={() => setAddingNew(true)} className="mt-2 text-xs text-[#0969da] hover:underline">Create your first plan</button>
            </div>
          )}
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className={`w-full text-left px-4 py-2.5 border-b border-[#f0f2f4] transition-colors group flex items-center justify-between gap-2 ${
                plan.id === activePlanId ? "bg-[#f6f8fa] text-[#1f2328]" : "hover:bg-[#f6f8fa] text-[#57606a]"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium">{plan.title}</p>
                {(plan.ideaCards?.length ?? 0) > 0 && (
                  <p className="text-[10px] text-[#8c959f]">{plan.ideaCards.length} idea{plan.ideaCards.length !== 1 ? "s" : ""}</p>
                )}
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex-shrink-0 text-[#8c959f] hover:text-[#cf222e] transition-all cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Detail area ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f8fa]">
        {activePlan ? (
          <>
            {/* Title */}
            <div className="px-8 pt-6 pb-4 flex-shrink-0">
              <input
                value={activePlan.title}
                onChange={(e) => updatePlan(activePlan.id, { title: e.target.value })}
                className="w-full text-2xl font-semibold text-[#1f2328] bg-transparent outline-none border-none placeholder-[#8c959f]"
                placeholder="Plan title"
              />
              <p className="text-xs text-[#8c959f] mt-1">
                Created {new Date(activePlan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-4 px-8 pb-8 min-h-0">

              {/* Goals & Milestones */}
              <div className="flex-shrink-0 rounded-xl border bg-[#f0fff4] border-[#2da44e]/30 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="#2da44e">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1a7f37]">Goals & Milestones</span>
                </div>
                <RichEditor
                  key={`goals-${activePlan.id}`}
                  value={activePlan.goals ?? ""}
                  onChange={(v) => updatePlan(activePlan.id, { goals: v })}
                  placeholder="What do you want to achieve?"
                />
              </div>

              {/* Ideas & Concepts — horizontal card scroll */}
              <div className="flex-1 min-h-0 rounded-xl border bg-[#fff8e1] border-[#f9c513]/40 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="#9a6700">
                      <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9a6700]">Ideas & Concepts</span>
                  </div>
                  <button
                    onClick={() => addIdeaCard(activePlan.id)}
                    className="flex items-center gap-1 text-xs text-[#9a6700] hover:text-[#7a5000] transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
                    </svg>
                    Add idea
                  </button>
                </div>

                {/* Horizontal scroll of idea cards */}
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
                  <div className="flex gap-3 h-full pb-1" style={{ minWidth: "fit-content" }}>
                    {(activePlan.ideaCards ?? []).length === 0 ? (
                      <div className="flex items-center justify-center w-full text-center">
                        <div>
                          <p className="text-sm text-[#9a6700]/60">No ideas yet</p>
                          <button
                            onClick={() => addIdeaCard(activePlan.id)}
                            className="mt-1 text-xs text-[#9a6700] hover:underline"
                          >
                            Add your first idea
                          </button>
                        </div>
                      </div>
                    ) : (
                      (activePlan.ideaCards ?? []).map((card) => (
                        <div
                          key={card.id}
                          className="flex-shrink-0 w-52 bg-white rounded-lg border border-[#f9c513]/50 p-3 flex flex-col gap-2 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <input
                              value={card.title}
                              onChange={(e) => updateIdeaCard(activePlan.id, card.id, { title: e.target.value })}
                              placeholder="Idea title"
                              className="flex-1 text-sm font-semibold text-[#1f2328] bg-transparent outline-none placeholder-[#c4a000]/50 min-w-0"
                            />
                            <button
                              onClick={() => deleteIdeaCard(activePlan.id, card.id)}
                              className="opacity-0 group-hover:opacity-100 text-[#8c959f] hover:text-[#cf222e] transition-all flex-shrink-0 mt-0.5"
                            >
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                              </svg>
                            </button>
                          </div>
                          <div className="w-full h-px bg-[#f9c513]/30" />
                          <textarea
                            value={card.desc}
                            onChange={(e) => updateIdeaCard(activePlan.id, card.id, { desc: e.target.value })}
                            placeholder="Describe the idea..."
                            className="flex-1 w-full text-xs text-[#57606a] bg-transparent outline-none resize-none leading-relaxed placeholder-[#c4a000]/40"
                            rows={6}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[#57606a]">Select a plan to start brainstorming</p>
              <button onClick={() => setAddingNew(true)} className="mt-3 text-sm text-[#0969da] hover:underline">or create a new plan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
