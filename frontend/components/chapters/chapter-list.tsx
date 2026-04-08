"use client"
import { useMemo } from "react"
import type { Chapter, Progress } from "@/types"
import { ChapterItem } from "./chapter-item"

interface ChapterListProps {
  chapters: Chapter[]
  bookId: string
  progress: Progress | null
}

export function ChapterList({ chapters, bookId, progress }: ChapterListProps) {
  const sorted = useMemo(() => [...chapters].sort((a, b) => a.index - b.index), [chapters])
  return (
    <div>
      {sorted.map((ch) => (
        <ChapterItem key={ch.id} chapter={ch} bookId={bookId} progress={progress} />
      ))}
    </div>
  )
}
