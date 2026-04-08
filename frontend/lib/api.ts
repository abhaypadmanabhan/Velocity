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
  if (!res.ok) throw Object.assign(new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status}`), { status: res.status })
  // 204 No Content — return empty object; callers that need void ignore the return value
  if (res.status === 204) return {} as T
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
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null
      throw err
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

  async getStats(): Promise<import("@/types").Stats> {
    const raw = await request<Record<string, unknown>>("/stats/")
    return {
      totalBooks: raw.total_books as number,
      totalWordsRead: raw.total_words_read as number,
      avgWpm: raw.avg_wpm as number,
      chaptersCompleted: raw.chapters_completed as number,
      overallProgressPercent: raw.overall_progress_percent as number,
    }
  },

  async getAnalytics(): Promise<import("@/types").AnalyticsData> {
    const raw = await request<Record<string, unknown>>("/stats/analytics")
    return {
      progression: (raw.progression as Record<string, unknown>[]).map((p) => ({
        date: p.date as string,
        wpm: p.wpm as number,
      })),
      enduranceMins: raw.endurance_mins as number,
      enduranceSustainedWpm: raw.endurance_sustained_wpm as number,
      enduranceVsPrev: raw.endurance_vs_prev as number,
      heatmap: (raw.heatmap as Record<string, unknown>[]).map((h) => ({
        dayStr: h.day_str as string,
        week: h.week as number,
        wpm: h.wpm as number,
        retention: h.retention as number,
      })),
    }
  },
}
