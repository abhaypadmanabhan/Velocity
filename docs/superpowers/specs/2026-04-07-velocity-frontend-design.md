# Velocity Frontend Design Spec
**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

Velocity is a personal speed-reading app. Users upload PDF documents, the app breaks them into chapters and individual words, and the reader displays words one at a time at a fixed focal point (RSVP — Rapid Serial Visual Presentation). Reading speed is controlled by a WPM slider.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js (App Router) | SSR, file-based routing, production-ready |
| Backend | FastAPI (Python) | pymupdf for accurate PDF parsing, async, typed |
| Local persistence | Dexie.js (IndexedDB) | Stores PDF blobs + progress, offline-first |
| Remote persistence | SQLite (dev) / Postgres (prod) via SQLAlchemy | Cloud backup and cross-device sync |
| Components | shadcn + @cult-ui | Brutalist design system alignment |
| PDF parsing (client) | pdf.js | Offline fallback when backend unreachable |
| PDF parsing (server) | pymupdf | Authoritative parsing, ToC/bookmark support |

---

## Project Structure

```
Velocity/
├── frontend/                        # Next.js App Router
│   ├── app/
│   │   ├── layout.tsx               # Root layout, fonts, theme
│   │   ├── page.tsx                 # Library (home) — book grid + upload
│   │   ├── book/[id]/
│   │   │   ├── page.tsx             # Chapters view
│   │   │   └── read/page.tsx        # RSVP Reader
│   ├── components/
│   │   ├── ui/                      # shadcn + @cult-ui components
│   │   ├── library/                 # UploadZone, BookCard, BookGrid
│   │   ├── chapters/                # ChapterList, ChapterItem
│   │   └── reader/                  # RSVPDisplay, WPMSlider, ReaderControls
│   ├── lib/
│   │   ├── db.ts                    # Dexie.js IndexedDB schema + queries
│   │   ├── pdf.ts                   # pdf.js client-side parsing
│   │   ├── rsvp.ts                  # RSVP engine (word ticker, WPM timing)
│   │   └── api.ts                   # HTTP client for backend calls
│   ├── components.json              # shadcn config with @cult-ui registry
│   └── package.json
│
├── backend/                         # FastAPI (Python)
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── routers/
│   │   │   ├── books.py             # POST /books, GET /books, DELETE /books/:id
│   │   │   ├── progress.py          # GET/PUT /books/:id/progress
│   │   │   └── parse.py             # POST /books/:id/parse
│   │   ├── models/
│   │   │   ├── book.py
│   │   │   └── progress.py
│   │   ├── services/
│   │   │   ├── storage.py           # PDF file storage (local or S3)
│   │   │   └── pdf_parser.py        # pymupdf chapter/word extraction
│   │   └── db.py                    # SQLAlchemy setup
│   ├── requirements.txt
│   └── .env
│
├── assets/stitch/                   # Design references (Stitch exports)
└── tasks/
```

---

## Design System

Derived from Stitch designs ("Library & Chapters", "Reader Focus Mode"):

| Token | Value |
|-------|-------|
| Background | `#120216` |
| Surface | `#1e0824` |
| Muted | `#4a2c5a` |
| Accent purple | `#dbb8ff` |
| Primary red | `#ee1438` |
| Text | `#ffffff` |
| Font display | Space Grotesk |
| Font mono | JetBrains Mono |
| Border radius | `0px` (brutalist, all elements) |

---

## Data Layer

### IndexedDB (Dexie.js) — local, offline-first

```ts
// books
{ id, title, author, filename, pdfBlob, totalWords, chapters[], createdAt }

// chapters
{ id, bookId, title, index, wordStart, wordEnd }

// progress
{ bookId, chapterId, wordIndex, wpm, lastReadAt }
```

### Backend DB (SQLAlchemy)

```
books      — id, title, author, filename, storage_path, total_words, created_at
chapters   — id, book_id, title, index, word_start, word_end
progress   — book_id, word_index, wpm, last_read_at
```

**Sync strategy:** Local-first. Progress written to IndexedDB immediately, synced to backend in background. On app load, backend progress overwrites local if `last_read_at` is newer.

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Library | Book grid, upload zone |
| `/book/[id]` | Chapters | Chapter list with progress indicators |
| `/book/[id]/read` | Reader | RSVP display, WPM slider, controls |

---

## Core Components

### Library (`/`)
- **`UploadZone`** — drag-and-drop or click-to-upload PDF; triggers backend parse + local IndexedDB write
- **`BookCard`** — cover (generated from first page), title, author, progress bar (% words read), last read date
- **`BookGrid`** — responsive grid of BookCards; empty state with upload prompt

### Chapters (`/book/[id]`)
- **`ChapterList`** — vertical list of chapters with word count and completion indicator (red fill on done)
- **`ChapterItem`** — chapter title, word range, "Continue" if in-progress / "Read" if untouched

### Reader (`/book/[id]/read`)
- **`RSVPDisplay`** — centered single word in JetBrains Mono, large. ORP anchor letter in red (`#ee1438`), surrounding letters white. Position never shifts
- **`WPMSlider`** — horizontal slider, 100–1000 WPM range, live label. Built on shadcn `Slider`
- **`ReaderControls`** — Play/Pause, back/forward 10 words, chapter selector. Full keyboard support
- **`ProgressBar`** — thin red line across top showing position within chapter

### Shared
- **`NavBar`** — Velocity wordmark (Space Grotesk bold), back arrow on inner pages
- All components: zero border radius, dark surface, red accents, white text

---

## PDF Processing Pipeline

```
User drops PDF
  → POST /books/:id/parse (backend)
  → pymupdf extracts: title, author, full text, ToC/bookmarks
  → chapter boundaries detected
  → each chapter split into word array, stored in DB
  → returns { bookId, chapters[], totalWords }
  → frontend writes pdfBlob + metadata to IndexedDB
  → user lands on Chapters page
```

**Chapter detection priority:**
1. PDF Table of Contents / bookmarks
2. Heading heuristics (large font, bold, short line)
3. Fallback: single "Full Document" chapter

**Word splitting:**
- Split on whitespace, punctuation stays attached to words
- Hyphenation artifacts from line breaks stripped
- Empty strings and lone punctuation filtered

**Client-side fallback:** If backend unreachable, `pdf.js` runs in browser with same logic. Syncs to backend when connection restores.

---

## RSVP Reader Engine (`lib/rsvp.ts`)

```
interval = 60000 / WPM  (ms per word)

State: { words[], currentIndex, isPlaying, wpm }

Play       → setInterval fires every interval ms, increments currentIndex
Pause      → clearInterval, save progress to IndexedDB immediately
Seek       → clear + restart interval at new index
WPM change → clear + restart interval at new speed
```

**Optimal Recognition Point (ORP):** Anchor letter (~30% into word) fixed at horizontal center, rendered red. Eye never moves.

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` / `→` | Back / Forward 10 words |
| `[` / `]` | WPM −50 / +50 |
| `Esc` | Exit to Chapters |

**Progress autosave:**
- Every 30 words → write `{ wordIndex, wpm }` to IndexedDB
- On unmount → always save current position
- Every 60s while playing → background sync to backend

**Chapter end:** Pause + overlay with "Next Chapter" and "Back to Library" options.
