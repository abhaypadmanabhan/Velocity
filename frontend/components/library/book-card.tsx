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
    <Link href={`/book/${book.id}`} className="block bg-surface border border-muted hover:border-primary transition-colors p-5 group">
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
