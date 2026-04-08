import type { Book, Progress } from "@/types"
import { BookCard } from "./book-card"

interface BookGridProps {
  books: Book[]
  progress: Record<string, Progress>
  deletingBookIds: Set<string>
  onDelete: (bookId: string) => void
}

export function BookGrid({ books, progress, deletingBookIds, onDelete }: BookGridProps) {
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
        <BookCard
          key={book.id}
          book={book}
          progress={progress[book.id] ?? null}
          onDelete={onDelete}
          isDeleting={deletingBookIds.has(book.id)}
        />
      ))}
    </div>
  )
}
