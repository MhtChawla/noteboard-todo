# Noteboard — Developer Notes

A minimal Notion-like Kanban board with a personal notes panel. No backend, no auth, no external dependencies beyond Next.js and Tailwind.

---

## What it does

- **Kanban board** with 4 fixed columns: To Do · In Progress · Complete · Blocked
- **Tasks** can be created per column, dragged between columns, edited inline, or moved via a context menu
- **Notes panel** (right sidebar) — a freeform text area completely independent of the board
- **Progress bar** in the header tracks completed vs total tasks
- Everything persists in `localStorage` — no server, no database

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Storage | Browser `localStorage` |
| Bundler (dev) | Turbopack (default in Next 16) |
| React | 19.2.4 |

No extra UI libraries. Drag-and-drop uses the native HTML5 `draggable` API.

---

## File map

```
app/
  layout.tsx        — root layout, sets font & metadata, no providers needed
  page.tsx          — entry point, owns all task state, wires everything together
  globals.css       — base styles, scrollbar, keyframe animations

components/
  TaskCard.tsx      — single task card (drag source, inline edit, 3-dot menu)
  Column.tsx        — a kanban column (drop target, add-task form, empty state)
  NotesPanel.tsx    — collapsible right sidebar with autosave textarea

lib/
  types.ts          — Task, Status, Column types + COLUMNS config array
  storage.ts        — thin localStorage read/write helpers (tasks + notes)
```

---

## Data model

```ts
// lib/types.ts

type Status = "todo" | "progress" | "complete" | "blocked"

interface Task {
  id: string        // "task_{timestamp}_{random5}"
  title: string
  description: string
  status: Status
  createdAt: number // Date.now()
  tags: string[]    // exists on type, not yet used in UI
}
```

`COLUMNS` in `lib/types.ts` is the single source of truth for column order, labels, and colors. Change it there and the board updates automatically — no other file needs touching.

---

## localStorage keys

| Key | Value |
|---|---|
| `noteboard_tasks` | `JSON.stringify(Task[])` |
| `noteboard_notes` | raw string |

Both are written synchronously on every state change (tasks) or after a 600ms debounce (notes).

---

## State architecture

All task state lives in `page.tsx` via a single `useState<Task[]>`. Components receive callbacks (`onAddTask`, `onUpdateTask`, `onDeleteTask`) — no context, no zustand, no reducer. This is intentional to keep things simple; if the app grows and prop-drilling becomes painful, lift to React Context first before adding a state library.

### Drag and drop

Uses a `useRef<string | null>` (`dragTaskId`) to track the dragged task ID across the drag lifecycle — avoids re-renders during drag. Flow:

1. `TaskCard` fires `onDragStart(task.id)` → stored in ref
2. `Column` fires `onDrop(targetStatus)` → calls `updateTask(dragTaskId, { status })`

No library needed because cards only move between columns (not reordering within a column).

---

## Hydration guard

`page.tsx` renders a spinner until `mounted = true` (set in `useEffect`). This prevents a hydration mismatch since `localStorage` doesn't exist on the server.

---

## Adding a new column

1. Add an entry to the `COLUMNS` array in `lib/types.ts`
2. Add the new id to the `Status` union type in the same file

That's it — `page.tsx` maps over `COLUMNS` dynamically.

---

## Running locally

```bash
cd noteboard
npm run dev       # http://localhost:3000
npm run build     # production build
npm run start     # serve production build
```

---

## Things not built (obvious next steps)

- **Reordering cards within a column** — would need index-aware drag logic or a library like `dnd-kit`
- **Tags / labels** — the `tags: string[]` field exists on `Task` but has no UI yet
- **Due dates**
- **Multi-board / workspaces**
- **Export to JSON** — trivial since everything is already JSON in localStorage
- **Dark mode** — globals.css has no dark theme yet; Tailwind's `dark:` variants are available
