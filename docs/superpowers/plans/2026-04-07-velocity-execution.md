# Velocity Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Velocity RSVP speed-reading app — FastAPI backend + Next.js frontend — using subagent-driven development with spec compliance + code quality gates after every task.

**Architecture:** Backend (FastAPI + SQLite + pymupdf) first, then frontend (Next.js App Router + Dexie.js + RSVP engine). Frontend uses the Velocity brutalist design system with shadcn/ui components supplemented by @cult-ui components discovered and installed via the shadcn MCP.

**Tech Stack:** Python 3.11 / FastAPI / SQLAlchemy / pymupdf · Next.js 14 / TypeScript / Tailwind v3 / shadcn/ui / @cult-ui / Dexie.js / Vitest

---

## Prerequisites

Before dispatching any task subagents:

- [ ] **Confirm working directory:** `/Users/abhayp/Downloads/Projects/Velocity`
- [ ] **Confirm on branch:** `main` (no isolated worktree needed — project is greenfield)
- [ ] **Read both implementation plans in full:**
  - `docs/superpowers/plans/2026-04-07-velocity-backend.md` (8 tasks)
  - `docs/superpowers/plans/2026-04-07-velocity-frontend.md` (15 tasks)
- [ ] **Create TodoWrite** with all 23 tasks before dispatching the first subagent

---

## Cult-UI Component Strategy

The frontend uses @cult-ui components for richer UI primitives. Before implementing each frontend task, the subagent should:

1. Use `mcp__shadcn__search_items_in_registries` with `registries: ["cult"]` to discover relevant components
2. Use `mcp__shadcn__get_item_examples_from_registries` to see usage before installing
3. Install via `npx shadcn@latest add cult/<component-name>` (requires `components.json` to have cult registry)

**Confirmed cult-ui components for Velocity tasks:**

| Frontend Task | Cult-UI Component to Evaluate | Install Command |
|---|---|---|
| Task 8 — UploadZone | `file-uploader` or `dropzone` | `npx shadcn@latest add cult/file-uploader` |
| Task 9 — BookCard | `card` | `npx shadcn@latest add cult/card` |
| Task 12 — RSVPDisplay | `text-animate` or `scramble-text` | `npx shadcn@latest add cult/text-animate` |
| Task 13 — ContextSnippet | `bg-animate` | search first to confirm |
| Task 14 — WPMSlider | `slider` (shadcn built-in is fine) | already added in Task 1 |

**MCP tools available to subagents:**
- `mcp__shadcn__search_items_in_registries` — fuzzy search by name/description
- `mcp__shadcn__get_item_examples_from_registries` — see usage examples before installing
- `mcp__shadcn__view_items_in_registries` — inspect full component source
- `mcp__shadcn__list_items_in_registries` — list all cult components
- `mcp__shadcn__get_add_command_for_items` — get exact install command

**Key rule for subagents:** Always search cult registry first. If a cult-ui component provides what is needed, use it. Only fall back to hand-rolling a component if no suitable cult-ui option exists.

---

## Phase 1: Backend (Tasks 1–8)

Execute tasks from `docs/superpowers/plans/2026-04-07-velocity-backend.md` in order.

### B1: Scaffold backend directory and dependencies

**Source:** Backend plan Task 1  
**Model:** `haiku` (mechanical scaffolding)  
**Expected outcome:** `backend/` directory created, venv activated, `python -c "from app.main import app; print('OK')"` outputs `OK`

- [ ] Dispatch implementer subagent with full text of Backend Task 1
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B2: Database models

**Source:** Backend plan Task 2  
**Model:** `haiku`  
**Expected outcome:** `pytest tests/test_models.py -v` → 2 passed

- [ ] Dispatch implementer subagent with full text of Backend Task 2
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B3: Pydantic schemas

**Source:** Backend plan Task 3  
**Model:** `haiku`  
**Expected outcome:** Schema verification command prints dict, no errors

- [ ] Dispatch implementer subagent with full text of Backend Task 3
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B4: Storage service

**Source:** Backend plan Task 4  
**Model:** `haiku`  
**Expected outcome:** `pytest tests/test_storage.py -v` → 3 passed

- [ ] Dispatch implementer subagent with full text of Backend Task 4
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B5: PDF parser service

**Source:** Backend plan Task 5  
**Model:** `sonnet` (regex + pymupdf heuristics require judgment)  
**Expected outcome:** `pytest tests/test_pdf_parser.py -v` → 3 passed

- [ ] Dispatch implementer subagent with full text of Backend Task 5
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B6: Books router

**Source:** Backend plan Task 6  
**Model:** `sonnet` (multi-file integration — router + main.py + tests)  
**Expected outcome:** `pytest tests/test_books.py -v` → 7 passed

- [ ] Dispatch implementer subagent with full text of Backend Task 6
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B7: Progress router

**Source:** Backend plan Task 7  
**Model:** `sonnet`  
**Expected outcome:** `pytest -v` (all tests) → all pass

- [ ] Dispatch implementer subagent with full text of Backend Task 7
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### B8: Smoke test running server

**Source:** Backend plan Task 8  
**Model:** `haiku`  
**Expected outcome:** All tests pass, server starts, Swagger UI loads

- [ ] Dispatch implementer subagent with full text of Backend Task 8
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

## Phase 2: Frontend (Tasks 1–15)

Execute tasks from `docs/superpowers/plans/2026-04-07-velocity-frontend.md` in order.

**Important context to pass to every frontend subagent:**
- Working directory: `/Users/abhayp/Downloads/Projects/Velocity/frontend`
- @cult-ui registry is configured in `components.json` at `https://www.cult-ui.com/r`
- Search cult registry via `mcp__shadcn__search_items_in_registries` with `registries: ["cult"]` before building any UI component
- Install cult-ui components with `npx shadcn@latest add cult/<name>`
- Design system: brutalist, zero border radius, `#120216` bg, `#ee1438` red, Space Grotesk + JetBrains Mono

---

### F1: Scaffold Next.js app + design system

**Source:** Frontend plan Task 1  
**Model:** `sonnet` (many config files, design token setup)  
**Cult-UI step:** After shadcn init, run `mcp__shadcn__list_items_in_registries` with `registries: ["cult"]` to document available components  
**Expected outcome:** `npm run dev` starts on port 3000 with no errors; dark purple background visible

- [ ] Dispatch implementer subagent with full text of Frontend Task 1
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F2: Shared TypeScript types

**Source:** Frontend plan Task 2  
**Model:** `haiku`  
**Expected outcome:** `frontend/types/index.ts` exports `Book`, `Chapter`, `Progress` interfaces; `npx tsc --noEmit` passes

- [ ] Dispatch implementer subagent with full text of Frontend Task 2
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F3: Dexie.js local database

**Source:** Frontend plan Task 3  
**Model:** `haiku`  
**Expected outcome:** Vitest tests pass for Dexie schema (books, chapters, progress tables)

- [ ] Dispatch implementer subagent with full text of Frontend Task 3
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F4: PDF client-side extraction

**Source:** Frontend plan Task 4  
**Model:** `sonnet` (pdfjs-dist setup has known gotchas with Next.js)  
**Expected outcome:** Vitest tests for `lib/pdf.ts` pass; words array returned for a test PDF

- [ ] Dispatch implementer subagent with full text of Frontend Task 4
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F5: Backend API client

**Source:** Frontend plan Task 5  
**Model:** `haiku`  
**Expected outcome:** `lib/api.ts` exports typed functions; Vitest mock tests pass

- [ ] Dispatch implementer subagent with full text of Frontend Task 5
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F6: RSVP engine (pure TypeScript)

**Source:** Frontend plan Task 6  
**Model:** `sonnet` (state machine + ORP anchor calculation + interval logic)  
**Expected outcome:** Vitest tests for `lib/rsvp.ts` pass; ORP index correctly computed

- [ ] Dispatch implementer subagent with full text of Frontend Task 6
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F7: useRsvp hook

**Source:** Frontend plan Task 7  
**Model:** `sonnet` (React hook + timer management)  
**Expected outcome:** Vitest/React Testing Library tests pass for play/pause/seek/wpm

- [ ] Dispatch implementer subagent with full text of Frontend Task 7
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F8: NavBar

**Source:** Frontend plan Task 8  
**Model:** `haiku`  
**Cult-UI step:** Search `mcp__shadcn__search_items_in_registries` for "nav" or "header" to find any cult nav primitives  
**Expected outcome:** NavBar renders VELOCITY wordmark; back arrow conditionally shown

- [ ] Dispatch implementer subagent with full text of Frontend Task 8
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F9: BookCard + BookGrid

**Source:** Frontend plan Task 9  
**Model:** `sonnet`  
**Cult-UI step:** Search for "card" — use `cult/card` if available; inspect with `mcp__shadcn__get_item_examples_from_registries`  
**Expected outcome:** BookCard renders title, author, progress bar; BookGrid shows empty state or grid

- [ ] Dispatch implementer subagent with full text of Frontend Task 9
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F10: UploadZone

**Source:** Frontend plan Task 10  
**Model:** `sonnet`  
**Cult-UI step:** Search `mcp__shadcn__search_items_in_registries` for "file" or "upload" or "drop" in cult registry; install if suitable match found  
**Expected outcome:** UploadZone accepts PDF drop/click; triggers parse + save to Dexie; shows error for non-PDF

- [ ] Dispatch implementer subagent with full text of Frontend Task 10
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F11: Library page (app/page.tsx)

**Source:** Frontend plan Task 11  
**Model:** `haiku`  
**Expected outcome:** `app/page.tsx` renders NavBar + UploadZone + BookGrid; navigates to chapters on card click

- [ ] Dispatch implementer subagent with full text of Frontend Task 11
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F12: ChapterList + Chapters page

**Source:** Frontend plan Task 12  
**Model:** `haiku`  
**Expected outcome:** ChapterItem shows title + word count + Read/Continue button; ChapterList renders ordered list

- [ ] Dispatch implementer subagent with full text of Frontend Task 12
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F13: Reader components

**Source:** Frontend plan Task 13  
**Model:** `opus` (RSVPDisplay ORP styling + ContextSnippet + all reader UI is design-critical)  
**Cult-UI step:**
- Search for `text-animate` or `scramble-text` for RSVPDisplay word transition effect
- Search for `bg-animate` for ContextSnippet highlight effect
- Use `mcp__shadcn__get_item_examples_from_registries` before installing anything
**Components:** `RSVPDisplay`, `ContextSnippet`, `ChapterHeader`, `ProgressBar`, `WPMSlider`, `ReaderControls`  
**Expected outcome:** All reader components render with correct brutalist styling; ORP letter highlighted red

- [ ] Dispatch implementer subagent with full text of Frontend Task 13
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F14: Reader page wiring (app/book/[id]/read/page.tsx)

**Source:** Frontend plan Task 14  
**Model:** `sonnet` (wires all reader components + useRsvp hook + Dexie progress sync)  
**Expected outcome:** Reader page plays words, shows context snippet, updates progress, accepts keyboard shortcuts (space=play/pause, ←/→=±10 words)

- [ ] Dispatch implementer subagent with full text of Frontend Task 14
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

### F15: End-to-end smoke test

**Source:** Frontend plan Task 15  
**Model:** `haiku`  
**Expected outcome:** `npm run test` → all Vitest tests pass; manual check: upload PDF → chapters appear → reader plays words

- [ ] Dispatch implementer subagent with full text of Frontend Task 15
- [ ] Spec compliance review
- [ ] Code quality review
- [ ] Mark complete

---

## Phase 3: Integration Verification

After all 23 tasks complete:

- [ ] **Start backend:** `cd backend && source .venv/bin/activate && python run.py`
- [ ] **Start frontend:** `cd frontend && npm run dev`
- [ ] **Full flow test:**
  1. Upload a real PDF via the UI (not Swagger)
  2. Confirm chapters appear on chapters page
  3. Click Read on a chapter — reader page loads
  4. Press Space — words flash at default 250 WPM
  5. Drag WPM slider to 500 — speed increases
  6. Press ← / → — position shifts ±10 words
  7. Refresh reader page — position is restored (Dexie persistence)
  8. Check backend: `GET /books/` returns the uploaded book
- [ ] **Run full test suites:**
  ```bash
  cd backend && pytest -v --tb=short
  cd frontend && npm run test
  ```
  Expected: zero failures in both suites
- [ ] Dispatch `superpowers:finishing-a-development-branch`

---

## Subagent Context Template

Every implementer subagent dispatch must include:

```
Project: Velocity — RSVP speed-reading app
Working directory: /Users/abhayp/Downloads/Projects/Velocity
Stack: Next.js 14 App Router (frontend/) + FastAPI (backend/)
Design: Brutalist — #120216 bg, #ee1438 red accent, Space Grotesk + JetBrains Mono, zero border radius
Shadcn: @cult-ui registry configured in components.json at https://www.cult-ui.com/r
       Use mcp__shadcn__search_items_in_registries with registries: ["cult"] before building UI
Skill: superpowers:test-driven-development (TDD for every task)

Task to implement:
[FULL TASK TEXT FROM PLAN]
```
