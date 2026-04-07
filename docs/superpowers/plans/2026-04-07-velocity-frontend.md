# Velocity Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js App Router frontend for Velocity — a speed-reading app where users upload PDFs, browse chapters, and read via RSVP (word-by-word display) with a live context snippet and WPM speed control.

**Architecture:** All state is local-first via Dexie.js (IndexedDB). PDFs are parsed client-side with pdf.js (fallback) and server-side via the FastAPI backend. The RSVP engine is a pure TypeScript module wrapped in a React hook. Shadcn/ui + @cult-ui components styled with the Velocity brutalist design system (zero border radius, dark purple, red accent).

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS v3, shadcn/ui, @cult-ui, Dexie.js 3, pdfjs-dist, Vitest + jsdom + fake-indexeddb.

---

## File Map

```
frontend/
├── app/
│   ├── layout.tsx                   # Root layout: fonts, dark theme class, NavBar
│   ├── page.tsx                     # Library page: BookGrid + UploadZone
│   └── book/[id]/
│       ├── page.tsx                 # Chapters page: ChapterList
│       └── read/page.tsx            # Reader page: all reader components wired together
├── components/
│   ├── shared/
│   │   └── nav-bar.tsx              # Velocity wordmark + back arrow
│   ├── library/
│   │   ├── upload-zone.tsx          # Drag-and-drop PDF upload → triggers parse + save
│   │   ├── book-card.tsx            # Book title, author, progress bar, last read
│   │   └── book-grid.tsx            # Responsive grid of BookCards + empty state
│   ├── chapters/
│   │   ├── chapter-item.tsx         # Chapter row: title, word count, Read/Continue button
│   │   └── chapter-list.tsx         # Ordered list of ChapterItems
│   └── reader/
│       ├── chapter-header.tsx       # Current chapter title (muted, top of reader)
│       ├── progress-bar.tsx         # Red line across top, width = % progress
│       ├── rsvp-display.tsx         # ORP word display: anchor letter red, rest white
│       ├── context-snippet.tsx      # ±15 word window, current word softly highlighted
│       ├── wpm-slider.tsx           # shadcn Slider 100–1000 WPM with live label
│       └── reader-controls.tsx      # Play/Pause, ±10 words, chapter selector
├── hooks/
│   └── use-rsvp.ts                  # React hook wrapping lib/rsvp.ts engine
├── lib/
│   ├── db.ts                        # Dexie.js schema: books, chapters, progress tables
│   ├── pdf.ts                       # pdf.js text extraction → chapters + word arrays
│   ├── rsvp.ts                      # Pure RSVP engine: state machine, interval, ORP calc
│   └── api.ts                       # Typed fetch wrapper for backend REST endpoints
├── types/
│   └── index.ts                     # Shared TypeScript types: Book, Chapter, Progress
├── components.json                  # shadcn config with @cult-ui registry
├── tailwind.config.ts               # Design tokens: colors, fonts, border-radius: 0
├── vitest.config.ts
└── package.json
```

---

### Task 1: Scaffold Next.js app + design system

**Files:**
- Create: `frontend/` (Next.js app via CLI)
- Create: `frontend/components.json`
- Create: `frontend/tailwind.config.ts`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/abhayp/Downloads/Projects/Velocity
npx create-next-app@latest frontend \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*"
```

When prompted, accept all defaults.

- [ ] **Step 2: Install shadcn and init**

```bash
cd frontend
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Step 3: Add @cult-ui registry to components.json**

Open `frontend/components.json` and add the `registries` block. The full file should look like:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "cult": {
      "url": "https://www.cult-ui.com/r"
    }
  }
}
```

- [ ] **Step 4: Install base shadcn components we will use**

```bash
cd frontend
npx shadcn@latest add button slider
```

- [ ] **Step 5: Overwrite tailwind.config.ts with Velocity design tokens**

```typescript
// frontend/tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ee1438",
        "bg-dark": "#120216",
        surface: "#1e0824",
        muted: "#4a2c5a",
        "accent-purple": "#dbb8ff",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        full: "0px",
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 6: Update app/layout.tsx with fonts and dark theme**

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Velocity",
  description: "Read fast.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-bg-dark text-white font-display min-h-screen`}
      >
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Update globals.css to remove default Tailwind CSS variables that conflict**

Replace the contents of `frontend/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  border-radius: 0 !important;
}

body {
  background-color: #120216;
  color: #ffffff;
}
```

- [ ] **Step 8: Install Vitest for testing**

```bash
cd frontend
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 9: Write vitest.config.ts**

```typescript
// frontend/vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})
```

- [ ] **Step 10: Write vitest.setup.ts**

```typescript
// frontend/vitest.setup.ts
import "@testing-library/jest-dom"
```

- [ ] **Step 11: Add test script to package.json**

In `frontend/package.json`, add to the `scripts` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 12: Verify dev server starts**

```bash
cd frontend && npm run dev
```

Expected: `ready on http://localhost:3000` with no errors.

- [ ] **Step 13: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold Next.js frontend with Velocity design tokens and shadcn"
```

---

### Task 2: Shared TypeScript types

**Files:**
- Create: `frontend/types/index.ts`

- [ ] **Step 1: Write types/index.ts**

```typescript
// frontend/types/index.ts
export interface Chapter {
  id: string
  bookId: string
  title: string
  index: number
  wordStart: number
  wordEnd: number
  words: string[]
}

export interface Book {
  id: string
  title: string
  author: string | null
  filename: string
  totalWords: number
  createdAt: string
  chapters: Chapter[]
}

export interface Progress {
  bookId: string
  wordIndex: number
  wpm: number
  lastReadAt: string
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Dexie.js database

**Files:**
- Create: `frontend/lib/db.ts`
- Create: `frontend/lib/db.test.ts`

- [ ] **Step 1: Install Dexie and fake-indexeddb**

```bash
cd frontend
npm install dexie
npm install -D fake-indexeddb
```

- [ ] **Step 2: Write failing test**

```typescript
// frontend/lib/db.test.ts
import "fake-indexeddb/auto"
import { describe, it, expect, beforeEach } from "vitest"
import { db } from "./db"
import type { Book, Chapter, Progress } from "@/types"

const makeBook = (id = "b1"): Book => ({
  id,
  title: "Test Book",
  author: "Author",
  filename: "test.pdf",
  totalWords: 3,
  createdAt: new Date().toISOString(),
  chapters: [],
})

const makeChapter = (bookId = "b1"): Chapter => ({
  id: "c1",
  bookId,
  title: "Chapter 1",
  index: 0,
  wordStart: 0,
  wordEnd: 2,
  words: ["hello", "world", "foo"],
})

beforeEach(async () => {
  await db.books.clear()
  await db.chapters.clear()
  await db.progress.clear()
})

describe("db.books", () => {
  it("saves and retrieves a book", async () => {
    const book = makeBook()
    await db.books.put(book)
    const fetched = await db.books.get("b1")
    expect(fetched?.title).toBe("Test Book")
  })

  it("deletes a book", async () => {
    await db.books.put(makeBook())
    await db.books.delete("b1")
    expect(await db.books.get("b1")).toBeUndefined()
  })
})

describe("db.chapters", () => {
  it("saves and retrieves chapters by bookId", async () => {
    await db.chapters.put(makeChapter())
    const chapters = await db.chapters.where("bookId").equals("b1").toArray()
    expect(chapters).toHaveLength(1)
    expect(chapters[0].words).toEqual(["hello", "world", "foo"])
  })
})

describe("db.progress", () => {
  it("upserts progress", async () => {
    const p: Progress = { bookId: "b1", wordIndex: 42, wpm: 300, lastReadAt: new Date().toISOString() }
    await db.progress.put(p)
    const fetched = await db.progress.get("b1")
    expect(fetched?.wordIndex).toBe(42)
  })
})
```

- [ ] **Step 3: Run test — expect failure**

```bash
cd frontend && npm test -- lib/db.test.ts
```

Expected: `Cannot find module './db'`

- [ ] **Step 4: Write lib/db.ts**

```typescript
// frontend/lib/db.ts
import Dexie, { Table } from "dexie"
import type { Book, Chapter, Progress } from "@/types"

class VelocityDB extends Dexie {
  books!: Table<Book, string>
  chapters!: Table<Chapter, string>
  progress!: Table<Progress, string>

  constructor() {
    super("velocity")
    this.version(1).stores({
      books: "id, title, createdAt",
      chapters: "id, bookId, index",
      progress: "bookId",
    })
  }
}

export const db = new VelocityDB()
```

- [ ] **Step 5: Run test — expect pass**

```bash
cd frontend && npm test -- lib/db.test.ts
```

Expected: `6 passed`

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "feat: add Dexie.js IndexedDB schema for books, chapters, and progress"
```

---

### Task 4: API client

**Files:**
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/api.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// frontend/lib/api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { api } from "./api"

const mockBook = {
  id: "b1", title: "T", author: "A", filename: "f.pdf",
  total_words: 3, created_at: "2026-01-01T00:00:00", chapters: [],
}

beforeEach(() => { vi.restoreAllMocks() })

describe("api.uploadBook", () => {
  it("posts file and returns book", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockBook,
    } as Response)

    const file = new File(["%PDF"], "test.pdf", { type: "application/pdf" })
    const result = await api.uploadBook(file)

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/books/",
      expect.objectContaining({ method: "POST" }),
    )
    expect(result.id).toBe("b1")
  })
})

describe("api.listBooks", () => {
  it("fetches book list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBook],
    } as Response)

    const books = await api.listBooks()
    expect(books).toHaveLength(1)
  })
})

describe("api.updateProgress", () => {
  it("puts progress and returns updated record", async () => {
    const mockProgress = { book_id: "b1", word_index: 10, wpm: 300, last_read_at: "2026-01-01T00:00:00" }
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockProgress,
    } as Response)

    const result = await api.updateProgress("b1", { wordIndex: 10, wpm: 300 })
    expect(result.wordIndex).toBe(10)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd frontend && npm test -- lib/api.test.ts
```

Expected: `Cannot find module './api'`

- [ ] **Step 3: Write lib/api.ts**

```typescript
// frontend/lib/api.ts
import type { Book, Progress } from "@/types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function snakeToCamelBook(raw: Record<string, unknown>): Book {
  return {
    id: raw.id as string,
    title: raw.title as string,
    author: (raw.author as string | null) ?? null,
    filename: raw.filename as string,
    totalWords: raw.total_words as number,
    createdAt: raw.created_at as string,
    chapters: ((raw.chapters as unknown[]) ?? []).map((ch) => {
      const c = ch as Record<string, unknown>
      return {
        id: c.id as string,
        bookId: c.book_id as string,
        title: c.title as string,
        index: c.index as number,
        wordStart: c.word_start as number,
        wordEnd: c.word_end as number,
        words: (c.words as string[]) ?? [],
      }
    }),
  }
}

function snakeToCamelProgress(raw: Record<string, unknown>): Progress {
  return {
    bookId: raw.book_id as string,
    wordIndex: raw.word_index as number,
    wpm: raw.wpm as number,
    lastReadAt: raw.last_read_at as string,
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  async uploadBook(file: File): Promise<Book> {
    const form = new FormData()
    form.append("file", file)
    const raw = await request<Record<string, unknown>>("/books/", { method: "POST", body: form })
    return snakeToCamelBook(raw)
  },

  async listBooks(): Promise<Book[]> {
    const raw = await request<Record<string, unknown>[]>("/books/")
    return raw.map(snakeToCamelBook)
  },

  async getBook(bookId: string): Promise<Book> {
    const raw = await request<Record<string, unknown>>(`/books/${bookId}`)
    return snakeToCamelBook(raw)
  },

  async deleteBook(bookId: string): Promise<void> {
    await request(`/books/${bookId}`, { method: "DELETE" })
  },

  async getProgress(bookId: string): Promise<Progress | null> {
    try {
      const raw = await request<Record<string, unknown>>(`/books/${bookId}/progress`)
      return snakeToCamelProgress(raw)
    } catch {
      return null
    }
  },

  async updateProgress(bookId: string, update: { wordIndex: number; wpm: number }): Promise<Progress> {
    const raw = await request<Record<string, unknown>>(`/books/${bookId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_index: update.wordIndex, wpm: update.wpm }),
    })
    return snakeToCamelProgress(raw)
  },
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd frontend && npm test -- lib/api.test.ts
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/api.ts lib/api.test.ts
git commit -m "feat: add typed API client with snake_case → camelCase mapping"
```

---

### Task 5: RSVP engine

**Files:**
- Create: `frontend/lib/rsvp.ts`
- Create: `frontend/lib/rsvp.test.ts`
- Create: `frontend/hooks/use-rsvp.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/lib/rsvp.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createRSVP } from "./rsvp"

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

const words = ["one", "two", "three", "four", "five"]

describe("createRSVP", () => {
  it("starts at given index", () => {
    const rsvp = createRSVP({ words, initialIndex: 2, wpm: 60 })
    expect(rsvp.getState().currentIndex).toBe(2)
    expect(rsvp.getState().isPlaying).toBe(false)
  })

  it("advances words on play", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.play()
    vi.advanceTimersByTime(1000) // 60 WPM = 1000ms per word
    expect(rsvp.getState().currentIndex).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(rsvp.getState().currentIndex).toBe(2)
    rsvp.pause()
  })

  it("stops advancing on pause", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.play()
    vi.advanceTimersByTime(1000)
    rsvp.pause()
    vi.advanceTimersByTime(2000)
    expect(rsvp.getState().currentIndex).toBe(1)
  })

  it("seek jumps to index", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.seek(3)
    expect(rsvp.getState().currentIndex).toBe(3)
  })

  it("setWpm updates speed mid-play", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.play()
    rsvp.setWpm(120) // now 500ms per word
    vi.advanceTimersByTime(500)
    expect(rsvp.getState().currentIndex).toBe(1)
    rsvp.pause()
  })

  it("stops at last word without going out of bounds", () => {
    const rsvp = createRSVP({ words, initialIndex: 4, wpm: 60 })
    rsvp.play()
    vi.advanceTimersByTime(2000)
    expect(rsvp.getState().currentIndex).toBe(4)
    expect(rsvp.getState().isPlaying).toBe(false)
  })

  it("getOrpParts splits word at 30% position", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    expect(rsvp.getOrpParts("hello")).toEqual({ before: "h", anchor: "e", after: "llo" })
    expect(rsvp.getOrpParts("a")).toEqual({ before: "", anchor: "a", after: "" })
    expect(rsvp.getOrpParts("go")).toEqual({ before: "g", anchor: "o", after: "" })
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd frontend && npm test -- lib/rsvp.test.ts
```

Expected: `Cannot find module './rsvp'`

- [ ] **Step 3: Write lib/rsvp.ts**

```typescript
// frontend/lib/rsvp.ts
export interface RSVPState {
  currentIndex: number
  isPlaying: boolean
  wpm: number
}

export interface OrpParts {
  before: string
  anchor: string
  after: string
}

export interface RSVPEngine {
  play: () => void
  pause: () => void
  seek: (index: number) => void
  setWpm: (wpm: number) => void
  getState: () => RSVPState
  getOrpParts: (word: string) => OrpParts
  destroy: () => void
  onTick: (cb: (state: RSVPState) => void) => () => void
}

export function createRSVP(opts: {
  words: string[]
  initialIndex: number
  wpm: number
}): RSVPEngine {
  let currentIndex = opts.initialIndex
  let wpm = opts.wpm
  let isPlaying = false
  let timer: ReturnType<typeof setInterval> | null = null
  const listeners = new Set<(state: RSVPState) => void>()

  function getInterval() {
    return Math.round(60_000 / wpm)
  }

  function emit() {
    const state = { currentIndex, isPlaying, wpm }
    listeners.forEach((cb) => cb(state))
  }

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startTimer() {
    clearTimer()
    timer = setInterval(() => {
      if (currentIndex >= opts.words.length - 1) {
        isPlaying = false
        clearTimer()
        emit()
        return
      }
      currentIndex += 1
      emit()
    }, getInterval())
  }

  return {
    play() {
      if (isPlaying) return
      isPlaying = true
      startTimer()
      emit()
    },

    pause() {
      if (!isPlaying) return
      isPlaying = false
      clearTimer()
      emit()
    },

    seek(index: number) {
      const clamped = Math.max(0, Math.min(index, opts.words.length - 1))
      currentIndex = clamped
      if (isPlaying) startTimer()
      emit()
    },

    setWpm(newWpm: number) {
      wpm = newWpm
      if (isPlaying) startTimer()
      emit()
    },

    getState() {
      return { currentIndex, isPlaying, wpm }
    },

    getOrpParts(word: string): OrpParts {
      if (word.length === 0) return { before: "", anchor: "", after: "" }
      const anchorIdx = Math.floor(word.length * 0.3)
      return {
        before: word.slice(0, anchorIdx),
        anchor: word[anchorIdx],
        after: word.slice(anchorIdx + 1),
      }
    },

    destroy() {
      clearTimer()
      listeners.clear()
    },

    onTick(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd frontend && npm test -- lib/rsvp.test.ts
```

Expected: `7 passed`

- [ ] **Step 5: Write hooks/use-rsvp.ts**

```typescript
// frontend/hooks/use-rsvp.ts
"use client"
import { useEffect, useRef, useState } from "react"
import { createRSVP, RSVPEngine, RSVPState } from "@/lib/rsvp"

export function useRSVP(words: string[], initialIndex = 0, initialWpm = 250) {
  const engineRef = useRef<RSVPEngine | null>(null)
  const [state, setState] = useState<RSVPState>({
    currentIndex: initialIndex,
    isPlaying: false,
    wpm: initialWpm,
  })

  useEffect(() => {
    const engine = createRSVP({ words, initialIndex, wpm: initialWpm })
    engineRef.current = engine
    const unsub = engine.onTick((s) => setState({ ...s }))
    return () => {
      unsub()
      engine.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words])

  return {
    state,
    play: () => engineRef.current?.play(),
    pause: () => engineRef.current?.pause(),
    seek: (i: number) => engineRef.current?.seek(i),
    setWpm: (wpm: number) => engineRef.current?.setWpm(wpm),
    getOrpParts: (word: string) => engineRef.current?.getOrpParts(word) ?? { before: "", anchor: word, after: "" },
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/rsvp.ts lib/rsvp.test.ts hooks/use-rsvp.ts
git commit -m "feat: add RSVP engine with ORP calculation and useRSVP hook"
```

---

### Task 6: pdf.js client-side parser

**Files:**
- Create: `frontend/lib/pdf.ts`

- [ ] **Step 1: Install pdfjs-dist**

```bash
cd frontend && npm install pdfjs-dist
```

- [ ] **Step 2: Write lib/pdf.ts**

```typescript
// frontend/lib/pdf.ts
import type { Chapter } from "@/types"

// pdf.js worker must be configured before use in Next.js
let pdfjsLib: typeof import("pdfjs-dist") | null = null

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  }
  return pdfjsLib
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.trim() !== "" && !["—", "–", "-"].includes(w.trim()))
}

function fixHyphenation(text: string): string {
  return text.replace(/(\w+)-\n(\w+)/g, "$1$2")
}

export async function parsePdfFile(
  file: File
): Promise<{ title: string; chapters: Omit<Chapter, "id" | "bookId">[] }> {
  const lib = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise

  const info = await pdf.getMetadata()
  const title = (info.info as Record<string, string>)?.Title || file.name.replace(".pdf", "")

  // Try outline (ToC) first
  const outline = await pdf.getOutline()

  if (outline && outline.length > 0) {
    return { title, chapters: await parseWithOutline(pdf, outline) }
  }

  // Fallback: entire document as one chapter
  const allWords: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = fixHyphenation(content.items.map((item: { str?: string }) => item.str ?? "").join(" "))
    allWords.push(...splitWords(text))
  }

  return {
    title,
    chapters: [{ title: "Full Document", index: 0, wordStart: 0, wordEnd: allWords.length - 1, words: allWords }],
  }
}

async function parseWithOutline(
  pdf: import("pdfjs-dist").PDFDocumentProxy,
  outline: import("pdfjs-dist").PDFTreeNode[]
): Promise<Omit<Chapter, "id" | "bookId">[]> {
  const topLevel = outline.filter((item) => item.dest !== null)
  const chapters: Omit<Chapter, "id" | "bookId">[] = []
  let wordOffset = 0

  for (let i = 0; i < topLevel.length; i++) {
    const item = topLevel[i]
    const nextItem = topLevel[i + 1]

    const startPage = await resolveDestPage(pdf, item.dest)
    const endPage = nextItem ? await resolveDestPage(pdf, nextItem.dest) - 1 : pdf.numPages

    const words: string[] = []
    for (let p = startPage; p <= endPage && p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      const text = fixHyphenation(content.items.map((it: { str?: string }) => it.str ?? "").join(" "))
      words.push(...splitWords(text))
    }

    if (words.length > 0) {
      chapters.push({
        title: item.title,
        index: i,
        wordStart: wordOffset,
        wordEnd: wordOffset + words.length - 1,
        words,
      })
      wordOffset += words.length
    }
  }

  return chapters
}

async function resolveDestPage(
  pdf: import("pdfjs-dist").PDFDocumentProxy,
  dest: unknown
): Promise<number> {
  if (Array.isArray(dest)) {
    const ref = dest[0]
    const pageIndex = await pdf.getPageIndex(ref)
    return pageIndex + 1
  }
  if (typeof dest === "string") {
    const resolved = await pdf.getDestination(dest)
    if (resolved) return resolveDestPage(pdf, resolved)
  }
  return 1
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/pdf.ts
git commit -m "feat: add client-side PDF parser using pdf.js"
```

---

### Task 7: NavBar component

**Files:**
- Create: `frontend/components/shared/nav-bar.tsx`

- [ ] **Step 1: Write components/shared/nav-bar.tsx**

```tsx
// frontend/components/shared/nav-bar.tsx
"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface NavBarProps {
  showBack?: boolean
}

export function NavBar({ showBack = false }: NavBarProps) {
  const router = useRouter()

  return (
    <nav className="w-full h-12 bg-surface border-b border-muted flex items-center px-6 gap-4">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="text-muted hover:text-white transition-colors font-mono text-sm"
          aria-label="Go back"
        >
          ←
        </button>
      )}
      <Link href="/" className="font-display font-bold text-lg tracking-tight text-white">
        VELOCITY
      </Link>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/nav-bar.tsx
git commit -m "feat: add NavBar component"
```

---

### Task 8: UploadZone component

**Files:**
- Create: `frontend/components/library/upload-zone.tsx`

- [ ] **Step 1: Write components/library/upload-zone.tsx**

```tsx
// frontend/components/library/upload-zone.tsx
"use client"
import { useCallback, useState } from "react"

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) return
      await onUpload(file)
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <label
      className={`block w-full border-2 border-dashed p-12 text-center cursor-pointer transition-colors
        ${isDragging ? "border-primary bg-surface" : "border-muted hover:border-accent-purple"}
        ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf"
        className="sr-only"
        onChange={handleChange}
        disabled={isUploading}
      />
      <p className="font-display text-muted text-sm uppercase tracking-widest">
        {isUploading ? "Processing..." : "Drop PDF or click to upload"}
      </p>
    </label>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/library/upload-zone.tsx
git commit -m "feat: add UploadZone drag-and-drop component"
```

---

### Task 9: BookCard + BookGrid + Library page

**Files:**
- Create: `frontend/components/library/book-card.tsx`
- Create: `frontend/components/library/book-grid.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Write components/library/book-card.tsx**

```tsx
// frontend/components/library/book-card.tsx
import Link from "next/link"
import type { Book, Progress } from "@/types"

interface BookCardProps {
  book: Book
  progress: Progress | null
}

export function BookCard({ book, progress }: BookCardProps) {
  const pct = book.totalWords > 0 && progress
    ? Math.round((progress.wordIndex / book.totalWords) * 100)
    : 0

  return (
    <Link
      href={`/book/${book.id}`}
      className="block bg-surface border border-muted hover:border-primary transition-colors p-5 group"
    >
      <div className="aspect-[3/4] bg-muted mb-4 flex items-end p-3">
        <span className="font-mono text-xs text-accent-purple uppercase tracking-widest truncate w-full">
          {book.filename}
        </span>
      </div>
      <h3 className="font-display font-bold text-white text-base leading-tight mb-1 truncate group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      {book.author && (
        <p className="font-mono text-xs text-muted mb-3 truncate">{book.author}</p>
      )}
      <div className="w-full h-0.5 bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="font-mono text-xs text-muted mt-1">{pct}%</p>
    </Link>
  )
}
```

- [ ] **Step 2: Write components/library/book-grid.tsx**

```tsx
// frontend/components/library/book-grid.tsx
import type { Book, Progress } from "@/types"
import { BookCard } from "./book-card"

interface BookGridProps {
  books: Book[]
  progress: Record<string, Progress>
}

export function BookGrid({ books, progress }: BookGridProps) {
  if (books.length === 0) {
    return (
      <p className="font-mono text-muted text-sm text-center py-12 uppercase tracking-widest">
        No books yet. Upload a PDF to start.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} progress={progress[book.id] ?? null} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write app/page.tsx (Library page)**

```tsx
// frontend/app/page.tsx
"use client"
import { useEffect, useState, useCallback } from "react"
import { NavBar } from "@/components/shared/nav-bar"
import { UploadZone } from "@/components/library/upload-zone"
import { BookGrid } from "@/components/library/book-grid"
import { db } from "@/lib/db"
import { api } from "@/lib/api"
import type { Book, Progress } from "@/types"

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [isUploading, setIsUploading] = useState(false)

  const loadBooks = useCallback(async () => {
    const stored = await db.books.orderBy("createdAt").reverse().toArray()
    setBooks(stored)
    const allProgress = await db.progress.toArray()
    setProgress(Object.fromEntries(allProgress.map((p) => [p.bookId, p])))
  }, [])

  useEffect(() => { loadBooks() }, [loadBooks])

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    try {
      const book = await api.uploadBook(file)
      await db.books.put(book)
      await Promise.all(book.chapters.map((ch) => db.chapters.put(ch)))
      setBooks((prev) => [book, ...prev])
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setIsUploading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-dark">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-white mb-8 uppercase tracking-wide">
          Library
        </h1>
        <UploadZone onUpload={handleUpload} isUploading={isUploading} />
        <div className="mt-8">
          <BookGrid books={books} progress={progress} />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Verify page renders**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000`. Confirm: NavBar shows "VELOCITY", upload zone visible, empty state message shown.

- [ ] **Step 5: Commit**

```bash
git add components/library/ app/page.tsx
git commit -m "feat: add BookCard, BookGrid, and Library page with upload"
```

---

### Task 10: ChapterItem + ChapterList + Chapters page

**Files:**
- Create: `frontend/components/chapters/chapter-item.tsx`
- Create: `frontend/components/chapters/chapter-list.tsx`
- Create: `frontend/app/book/[id]/page.tsx`

- [ ] **Step 1: Write components/chapters/chapter-item.tsx**

```tsx
// frontend/components/chapters/chapter-item.tsx
import Link from "next/link"
import type { Chapter, Progress } from "@/types"

interface ChapterItemProps {
  chapter: Chapter
  bookId: string
  progress: Progress | null
}

export function ChapterItem({ chapter, bookId, progress }: ChapterItemProps) {
  const wordCount = chapter.wordEnd - chapter.wordStart + 1
  const isInProgress =
    progress &&
    progress.wordIndex >= chapter.wordStart &&
    progress.wordIndex <= chapter.wordEnd
  const isDone = progress && progress.wordIndex > chapter.wordEnd

  return (
    <div className="flex items-center justify-between border-b border-muted py-4 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {isDone && (
            <span className="w-2 h-2 bg-primary flex-shrink-0" />
          )}
          <h3 className="font-display font-bold text-white text-sm truncate">{chapter.title}</h3>
        </div>
        <p className="font-mono text-xs text-muted">{wordCount.toLocaleString()} words</p>
      </div>
      <Link
        href={`/book/${bookId}/read?chapter=${chapter.index}`}
        className="font-mono text-xs uppercase tracking-widest px-4 py-2 border border-muted hover:border-primary hover:text-primary transition-colors flex-shrink-0"
      >
        {isInProgress ? "Continue" : isDone ? "Reread" : "Read"}
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Write components/chapters/chapter-list.tsx**

```tsx
// frontend/components/chapters/chapter-list.tsx
import type { Chapter, Progress } from "@/types"
import { ChapterItem } from "./chapter-item"

interface ChapterListProps {
  chapters: Chapter[]
  bookId: string
  progress: Progress | null
}

export function ChapterList({ chapters, bookId, progress }: ChapterListProps) {
  const sorted = [...chapters].sort((a, b) => a.index - b.index)
  return (
    <div>
      {sorted.map((ch) => (
        <ChapterItem key={ch.id} chapter={ch} bookId={bookId} progress={progress} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write app/book/[id]/page.tsx**

```tsx
// frontend/app/book/[id]/page.tsx
"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { NavBar } from "@/components/shared/nav-bar"
import { ChapterList } from "@/components/chapters/chapter-list"
import { db } from "@/lib/db"
import type { Book, Progress } from "@/types"

export default function ChaptersPage() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    async function load() {
      const stored = await db.books.get(id)
      if (stored) setBook(stored)
      const p = await db.progress.get(id)
      if (p) setProgress(p)
    }
    load()
  }, [id])

  if (!book) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <NavBar showBack />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <p className="font-mono text-muted text-sm">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      <NavBar showBack />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1 uppercase tracking-wide">
          {book.title}
        </h1>
        {book.author && (
          <p className="font-mono text-xs text-muted mb-8">{book.author}</p>
        )}
        <ChapterList chapters={book.chapters} bookId={id} progress={progress} />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Verify page renders**

Upload a PDF on the library page, click the book card. Confirm chapter list shows with Read/Continue buttons.

- [ ] **Step 5: Commit**

```bash
git add components/chapters/ app/book/
git commit -m "feat: add ChapterItem, ChapterList, and Chapters page"
```

---

### Task 11: Reader UI components — ChapterHeader + ProgressBar

**Files:**
- Create: `frontend/components/reader/chapter-header.tsx`
- Create: `frontend/components/reader/progress-bar.tsx`

- [ ] **Step 1: Write components/reader/chapter-header.tsx**

```tsx
// frontend/components/reader/chapter-header.tsx
interface ChapterHeaderProps {
  title: string
  index: number
  total: number
}

export function ChapterHeader({ title, index, total }: ChapterHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-muted">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">
        {index + 1}/{total}
      </span>
      <span className="font-display text-sm text-muted truncate">{title}</span>
    </div>
  )
}
```

- [ ] **Step 2: Write components/reader/progress-bar.tsx**

```tsx
// frontend/components/reader/progress-bar.tsx
interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  return (
    <div className="w-full h-0.5 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/reader/chapter-header.tsx components/reader/progress-bar.tsx
git commit -m "feat: add ChapterHeader and ProgressBar reader components"
```

---

### Task 12: RSVPDisplay component (ORP rendering)

**Files:**
- Create: `frontend/components/reader/rsvp-display.tsx`

- [ ] **Step 1: Write components/reader/rsvp-display.tsx**

```tsx
// frontend/components/reader/rsvp-display.tsx
interface OrpParts {
  before: string
  anchor: string
  after: string
}

interface RSVPDisplayProps {
  word: string
  orpParts: OrpParts
}

export function RSVPDisplay({ word, orpParts }: RSVPDisplayProps) {
  if (!word) return null

  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ minHeight: "120px" }}
      aria-live="polite"
      aria-atomic="true"
      aria-label={word}
    >
      {/* Fixed-width ORP container so the anchor letter never shifts */}
      <div className="relative flex items-baseline font-mono text-5xl font-bold">
        {/* Left padding area — right-aligns the before text to anchor column */}
        <span className="text-white opacity-80 inline-block text-right" style={{ minWidth: "8ch" }}>
          {orpParts.before}
        </span>
        {/* Anchor letter — always at center, always red */}
        <span className="text-primary">{orpParts.anchor}</span>
        {/* After text — left-aligned from anchor */}
        <span className="text-white opacity-80 inline-block text-left" style={{ minWidth: "8ch" }}>
          {orpParts.after}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reader/rsvp-display.tsx
git commit -m "feat: add RSVPDisplay with ORP anchor letter alignment"
```

---

### Task 13: ContextSnippet component

**Files:**
- Create: `frontend/components/reader/context-snippet.tsx`

- [ ] **Step 1: Write components/reader/context-snippet.tsx**

```tsx
// frontend/components/reader/context-snippet.tsx
const WINDOW = 15 // words before and after current

interface ContextSnippetProps {
  words: string[]
  currentIndex: number
}

export function ContextSnippet({ words, currentIndex }: ContextSnippetProps) {
  const start = Math.max(0, currentIndex - WINDOW)
  const end = Math.min(words.length - 1, currentIndex + WINDOW)
  const snippet = words.slice(start, end + 1)
  const highlightIdx = currentIndex - start

  return (
    <div
      className="px-6 py-4 font-mono text-sm leading-relaxed pointer-events-none select-none"
      aria-hidden="true"
    >
      {snippet.map((word, i) => (
        <span key={`${start + i}-${word}`}>
          {i === highlightIdx ? (
            <span style={{ color: "rgba(219,184,255,0.55)" }}>{word}</span>
          ) : (
            <span style={{ color: "#4a2c5a" }}>{word}</span>
          )}{" "}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reader/context-snippet.tsx
git commit -m "feat: add ContextSnippet ±15 word reference window"
```

---

### Task 14: WPMSlider + ReaderControls

**Files:**
- Create: `frontend/components/reader/wpm-slider.tsx`
- Create: `frontend/components/reader/reader-controls.tsx`

- [ ] **Step 1: Write components/reader/wpm-slider.tsx**

```tsx
// frontend/components/reader/wpm-slider.tsx
"use client"
import { Slider } from "@/components/ui/slider"

interface WPMSliderProps {
  wpm: number
  onChange: (wpm: number) => void
}

export function WPMSlider({ wpm, onChange }: WPMSliderProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest w-8">Slow</span>
      <Slider
        min={100}
        max={1000}
        step={50}
        value={[wpm]}
        onValueChange={([val]) => onChange(val)}
        className="flex-1"
      />
      <span className="font-mono text-xs text-muted uppercase tracking-widest w-8 text-right">Fast</span>
      <span className="font-mono text-xs text-white w-20 text-right tabular-nums">
        {wpm} WPM
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Write components/reader/reader-controls.tsx**

```tsx
// frontend/components/reader/reader-controls.tsx
"use client"
import { Button } from "@/components/ui/button"

interface ReaderControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onBack: () => void
  onForward: () => void
}

export function ReaderControls({
  isPlaying,
  onPlay,
  onPause,
  onBack,
  onForward,
}: ReaderControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="font-mono text-xs border-muted text-muted hover:border-white hover:text-white"
        aria-label="Back 10 words"
      >
        ← 10
      </Button>
      <Button
        onClick={isPlaying ? onPause : onPlay}
        className="font-mono text-sm bg-primary hover:bg-primary/80 text-white border-none w-24"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "PAUSE" : "PLAY"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onForward}
        className="font-mono text-xs border-muted text-muted hover:border-white hover:text-white"
        aria-label="Forward 10 words"
      >
        10 →
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/reader/wpm-slider.tsx components/reader/reader-controls.tsx
git commit -m "feat: add WPMSlider and ReaderControls components"
```

---

### Task 15: Reader page — full integration

**Files:**
- Create: `frontend/app/book/[id]/read/page.tsx`

- [ ] **Step 1: Write app/book/[id]/read/page.tsx**

```tsx
// frontend/app/book/[id]/read/page.tsx
"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { NavBar } from "@/components/shared/nav-bar"
import { ChapterHeader } from "@/components/reader/chapter-header"
import { ProgressBar } from "@/components/reader/progress-bar"
import { RSVPDisplay } from "@/components/reader/rsvp-display"
import { ContextSnippet } from "@/components/reader/context-snippet"
import { WPMSlider } from "@/components/reader/wpm-slider"
import { ReaderControls } from "@/components/reader/reader-controls"
import { db } from "@/lib/db"
import { api } from "@/lib/api"
import { useRSVP } from "@/hooks/use-rsvp"
import type { Book, Chapter } from "@/types"

const AUTOSAVE_EVERY = 30 // words
const SYNC_EVERY_MS = 60_000

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [book, setBook] = useState<Book | null>(null)
  const [allWords, setAllWords] = useState<string[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [initialIndex, setInitialIndex] = useState(0)
  const [initialWpm, setInitialWpm] = useState(250)
  const [showComplete, setShowComplete] = useState(false)

  const lastSavedRef = useRef(0)
  const lastSyncRef = useRef(Date.now())

  // Load book + chapters + progress from IndexedDB
  useEffect(() => {
    async function load() {
      const stored = await db.books.get(id)
      if (!stored) return

      const chs = await db.chapters.where("bookId").equals(id).sortBy("index")
      const words = chs.flatMap((ch) => ch.words)

      setBook(stored)
      setChapters(chs)
      setAllWords(words)

      const progress = await db.progress.get(id)
      const targetChapterIdx = parseInt(searchParams.get("chapter") ?? "0", 10)
      const targetChapter = chs.find((c) => c.index === targetChapterIdx) ?? chs[0]

      if (progress && progress.wordIndex >= (targetChapter?.wordStart ?? 0)) {
        setInitialIndex(progress.wordIndex)
        setInitialWpm(progress.wpm)
      } else if (targetChapter) {
        setInitialIndex(targetChapter.wordStart)
      }
    }
    load()
  }, [id, searchParams])

  const { state, play, pause, seek, setWpm, getOrpParts } = useRSVP(
    allWords,
    initialIndex,
    initialWpm
  )

  const currentChapter = useMemo(() => {
    return chapters.find(
      (ch) => state.currentIndex >= ch.wordStart && state.currentIndex <= ch.wordEnd
    ) ?? chapters[0]
  }, [chapters, state.currentIndex])

  // Autosave progress every AUTOSAVE_EVERY words
  const saveProgress = useCallback(async (wordIndex: number, wpm: number) => {
    await db.progress.put({
      bookId: id,
      wordIndex,
      wpm,
      lastReadAt: new Date().toISOString(),
    })
    const now = Date.now()
    if (now - lastSyncRef.current > SYNC_EVERY_MS) {
      lastSyncRef.current = now
      api.updateProgress(id, { wordIndex, wpm }).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (state.currentIndex - lastSavedRef.current >= AUTOSAVE_EVERY) {
      lastSavedRef.current = state.currentIndex
      saveProgress(state.currentIndex, state.wpm)
    }
    if (!state.isPlaying && state.currentIndex >= allWords.length - 1 && allWords.length > 0) {
      setShowComplete(true)
    }
  }, [state, allWords.length, saveProgress])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (state.currentIndex > 0) {
        saveProgress(state.currentIndex, state.wpm)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      switch (e.key) {
        case " ":
          e.preventDefault()
          state.isPlaying ? pause() : play()
          break
        case "ArrowLeft":
          seek(state.currentIndex - 10)
          break
        case "ArrowRight":
          seek(state.currentIndex + 10)
          break
        case "[":
          setWpm(Math.max(100, state.wpm - 50))
          break
        case "]":
          setWpm(Math.min(1000, state.wpm + 50))
          break
        case "Escape":
          router.push(`/book/${id}`)
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [state, play, pause, seek, setWpm, router, id])

  const currentWord = allWords[state.currentIndex] ?? ""
  const orpParts = getOrpParts(currentWord)

  if (!book || allWords.length === 0) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <p className="font-mono text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <ProgressBar current={state.currentIndex} total={allWords.length} />
      <NavBar showBack />
      {currentChapter && (
        <ChapterHeader
          title={currentChapter.title}
          index={currentChapter.index}
          total={chapters.length}
        />
      )}

      {/* RSVP focal area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <RSVPDisplay word={currentWord} orpParts={orpParts} />
        <div className="w-full max-w-2xl mt-6">
          <ContextSnippet words={allWords} currentIndex={state.currentIndex} />
        </div>
      </div>

      {/* Controls pinned to bottom */}
      <div className="border-t border-muted bg-surface">
        <WPMSlider wpm={state.wpm} onChange={setWpm} />
        <ReaderControls
          isPlaying={state.isPlaying}
          onPlay={play}
          onPause={pause}
          onBack={() => seek(state.currentIndex - 10)}
          onForward={() => seek(state.currentIndex + 10)}
        />
      </div>

      {/* Chapter complete overlay */}
      {showComplete && (
        <div className="fixed inset-0 bg-bg-dark/90 flex flex-col items-center justify-center gap-6 z-50">
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Chapter Complete
          </h2>
          {currentChapter && currentChapter.index < chapters.length - 1 ? (
            <button
              onClick={() => {
                setShowComplete(false)
                const nextCh = chapters.find((c) => c.index === currentChapter.index + 1)
                if (nextCh) { seek(nextCh.wordStart); play() }
              }}
              className="font-mono text-sm uppercase tracking-widest px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Next Chapter →
            </button>
          ) : null}
          <button
            onClick={() => router.push(`/book/${id}`)}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-white transition-colors"
          >
            Back to Library
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify full reader flow**

```bash
cd frontend && npm run dev
```

1. Upload a PDF on `/`
2. Click into the book → chapters page
3. Click "Read" on any chapter → reader page
4. Press Space to start — words should advance
5. Move WPM slider — speed should change immediately
6. Press `[` / `]` — WPM adjusts by 50
7. Press `←` / `→` — jumps 10 words
8. Press Escape — returns to chapters
9. Close tab, reopen, navigate to book → should resume at saved word

- [ ] **Step 3: Run full test suite**

```bash
cd frontend && npm test
```

Expected: all tests pass (db, api, rsvp).

- [ ] **Step 4: Commit**

```bash
git add app/book/
git commit -m "feat: complete Reader page with RSVP, ContextSnippet, keyboard shortcuts, and autosave"
```

- [ ] **Step 5: Final build check**

```bash
cd frontend && npm run build
```

Expected: build completes with no type errors or missing modules.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: frontend complete — Velocity speed reader MVP"
```
