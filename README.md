# noteboard 🗂️

> your tasks. your notes. zero drama.

a clean, minimal kanban board that lives entirely in your browser. no accounts, no backend, no subscription. just open it and get to work.

---

## what's inside

**4 columns that actually make sense**

| column | vibe |
|---|---|
| 📋 To Do | the list that haunts you |
| ⚡ In Progress | where things actually happen |
| ✅ Complete | dopamine hits only |
| 🚧 Blocked | honest about it, at least |

**+ a notes panel** on the right — completely separate from the board. personal scratch pad, brain dump, whatever you need.

everything saves automatically to `localStorage`. refresh, close the tab, come back tomorrow — it's all there.

---

## quickstart

```bash
git clone <your-repo-url>
cd noteboard
npm install
npm run dev
```

open [http://localhost:3000](http://localhost:3000) and you're done.

---

## how to use it

**add a task** — click `+` next to any column header, or the dashed area when a column is empty

**move a task** — drag it to another column, or hit the `···` menu on any card → Move to

**edit a task** — `···` menu → Edit, or just double-tap the card

**notes** — click anywhere in the right panel and start typing. autosaves after 600ms. collapse it with the `<` button when you need more board space

---

## built with

- **Next.js 16** — app router
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**
- **localStorage** — the only database you need

zero external UI libraries. drag and drop is native HTML5.

---

## project structure

```
app/
  page.tsx          ← all state lives here
  layout.tsx
  globals.css

components/
  TaskCard.tsx      ← individual card (drag, edit, delete)
  Column.tsx        ← drop zone + add task form
  NotesPanel.tsx    ← the right sidebar

lib/
  types.ts          ← Task type + COLUMNS config
  storage.ts        ← localStorage read/write
```

see [`DEVELOPER_NOTES.md`](./DEVELOPER_NOTES.md) for architecture deep-dive.

---

## deploy

```bash
npm run build
npm run start
```

or one-click on [Vercel](https://vercel.com) — it just works.

---

made with ☕ and a strong opinion that productivity apps should not require a login
