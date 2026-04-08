import type { Chapter } from "@/types"

export function getStartChapterIndex(chapters: Chapter[], wordIndex: number | null | undefined): number {
  if (chapters.length === 0) return 0

  const sorted = [...chapters].sort((a, b) => a.index - b.index)
  if (wordIndex == null) return sorted[0].index

  for (const chapter of sorted) {
    if (wordIndex >= chapter.wordStart && wordIndex <= chapter.wordEnd) {
      return chapter.index
    }

    if (wordIndex < chapter.wordStart) {
      return chapter.index
    }
  }

  return sorted[sorted.length - 1].index
}
