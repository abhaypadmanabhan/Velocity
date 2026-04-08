import Link from "next/link"
import type { Chapter, Progress } from "@/types"

interface ChapterItemProps {
  chapter: Chapter
  bookId: string
  progress: Progress | null
}

export function ChapterItem({ chapter, bookId, progress }: ChapterItemProps) {
  const wordCount = chapter.wordEnd - chapter.wordStart + 1
  const isInProgress = progress && progress.wordIndex >= chapter.wordStart && progress.wordIndex <= chapter.wordEnd
  const isDone = progress && progress.wordIndex > chapter.wordEnd

  return (
    <div className="flex items-center justify-between border-b border-muted py-4 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {isDone && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
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
