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
