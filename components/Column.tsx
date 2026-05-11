"use client";

import { useState } from "react";
import { Column as ColumnType, Task, Status } from "@/lib/types";
import TaskCard from "./TaskCard";

interface Props {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (status: Status, title: string, description: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onDragStart: (taskId: string) => void;
  onDrop: (status: Status) => void;
}

export default function Column({
  column, tasks, onAddTask, onUpdateTask, onDeleteTask, onDragStart, onDrop,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  function submitNew() {
    if (!newTitle.trim()) return;
    onAddTask(column.id, newTitle.trim(), newDesc.trim());
    setNewTitle("");
    setNewDesc("");
    setAdding(false);
  }

  return (
    <div
      className="flex flex-col min-w-[240px] w-full"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => { onDrop(column.id); setIsDragOver(false); }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: column.dotColor }} />
          <span className="text-xs font-semibold text-[#1f2328] uppercase tracking-wider">{column.label}</span>
          <span className="text-xs bg-[#eaeef2] text-[#57606a] rounded-full px-2 py-0.5 font-medium">{tasks.length}</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          title="Add task"
          className="text-[#57606a] hover:text-[#0969da] hover:bg-[#ddf4ff] rounded-md p-1 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        className="flex-1 flex flex-col gap-2.5 rounded-xl p-2.5 min-h-[200px] transition-all duration-150 border-2"
        style={{
          background: isDragOver ? "#ddf4ff" : column.color,
          borderColor: isDragOver ? "#54aeff" : "transparent",
        }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            onDragStart={onDragStart}
          />
        ))}

        {adding && (
          <div className="fade-in bg-white rounded-lg border border-[#0969da] shadow-[0_0_0_3px_rgba(9,105,218,0.15)] p-3 flex flex-col gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNew()}
              placeholder="Task title..."
              className="text-sm font-medium text-[#1f2328] placeholder-[#8c959f] w-full"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
              className="text-xs text-[#57606a] placeholder-[#8c959f] border-t border-[#f0f0f0] pt-2 w-full"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAdding(false); setNewTitle(""); setNewDesc(""); }}
                className="text-xs px-3 py-1 rounded-md hover:bg-[#f6f8fa] text-[#57606a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitNew}
                className="text-xs px-3 py-1 rounded-md bg-[#0969da] text-white hover:bg-[#0860ca] transition-colors"
              >
                Add task
              </button>
            </div>
          </div>
        )}

        {tasks.length === 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-1.5 text-xs text-[#8c959f] hover:text-[#57606a] py-8 rounded-lg border-2 border-dashed border-[#d0d7de] hover:border-[#adb5bd] transition-all w-full"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
            </svg>
            Add a task
          </button>
        )}
      </div>
    </div>
  );
}
