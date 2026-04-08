import Link from "next/link"
import { AlertDialog } from "@base-ui/react/alert-dialog"
import type { Book, Progress } from "@/types"

interface BookCardProps {
  book: Book
  progress: Progress | null
  onDelete: (bookId: string) => void
  isDeleting: boolean
}

export function BookCard({ book, progress, onDelete, isDeleting }: BookCardProps) {
  const pct = book.totalWords > 0 && progress
    ? Math.round((progress.wordIndex / book.totalWords) * 100)
    : 0

  return (
    <div className="relative">
      <AlertDialog.Root>
        <AlertDialog.Trigger
          disabled={isDeleting}
          className="absolute top-2 right-2 z-10 font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-primary text-primary bg-bg-dark hover:bg-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          aria-label="Delete PDF"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop
            className={(state) => `fixed inset-0 z-40 bg-bg-dark/80 ${state.transitionStatus === "starting" ? "animate-in fade-in duration-150" : ""} ${state.transitionStatus === "ending" ? "animate-out fade-out duration-100" : ""}`}
          />
          <AlertDialog.Popup
            className={(state) => `fixed z-50 w-[calc(100%-2rem)] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-primary bg-surface p-5 ${state.transitionStatus === "starting" ? "animate-in fade-in zoom-in-95 duration-150" : ""} ${state.transitionStatus === "ending" ? "animate-out fade-out zoom-out-95 duration-100" : ""}`}
          >
            <AlertDialog.Title className="font-display font-bold text-lg text-white uppercase tracking-wide">
              Delete PDF permanently?
            </AlertDialog.Title>
            <AlertDialog.Description className="font-mono text-xs text-muted mt-2 leading-relaxed">
              This will remove the uploaded PDF and reading progress for this book. This action cannot be undone.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Close className="font-mono text-xs uppercase tracking-widest px-3 py-2 border border-muted text-muted hover:text-white hover:border-white transition-colors">
                Cancel
              </AlertDialog.Close>
              <AlertDialog.Close
                onClick={() => onDelete(book.id)}
                className="font-mono text-xs uppercase tracking-widest px-3 py-2 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                Delete PDF now
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
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
    </div>
  )
}
