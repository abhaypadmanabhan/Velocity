import { describe, expect, it } from "vitest"
import type { Chapter } from "@/types"
import { getStartChapterIndex } from "./dashboard"

const chapters: Chapter[] = [
  {
    id: "c1",
    bookId: "b1",
    title: "One",
    index: 0,
    wordStart: 0,
    wordEnd: 99,
    words: [],
  },
  {
    id: "c2",
    bookId: "b1",
    title: "Two",
    index: 1,
    wordStart: 100,
    wordEnd: 199,
    words: [],
  },
  {
    id: "c3",
    bookId: "b1",
    title: "Three",
    index: 2,
    wordStart: 200,
    wordEnd: 299,
    words: [],
  },
]

describe("getStartChapterIndex", () => {
  it("starts at first chapter when no progress exists", () => {
    expect(getStartChapterIndex(chapters, null)).toBe(0)
  })

  it("continues from the in-progress chapter", () => {
    expect(getStartChapterIndex(chapters, 150)).toBe(1)
  })

  it("jumps to the next unread chapter after completed chapters", () => {
    expect(getStartChapterIndex(chapters, 199)).toBe(1)
    expect(getStartChapterIndex(chapters, 200)).toBe(2)
  })

  it("falls back to last chapter when the book is fully completed", () => {
    expect(getStartChapterIndex(chapters, 1000)).toBe(2)
  })

  it("returns zero when chapter list is empty", () => {
    expect(getStartChapterIndex([], 50)).toBe(0)
  })
})
