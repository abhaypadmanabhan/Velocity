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
