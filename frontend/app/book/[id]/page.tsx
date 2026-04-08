"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { NavBar } from "@/components/shared/nav-bar"
import { ChapterList } from "@/components/chapters/chapter-list"
import { db } from "@/lib/db"
import type { Book, Progress } from "@/types"

export default function ChaptersPage() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    async function load() {
      const stored = await db.books.get(id)
      if (stored) setBook(stored)
      const p = await db.progress.get(id)
      if (p) setProgress(p)
    }
    load()
  }, [id])

  if (!book) {
    return (
      <div className="min-h-screen bg-bg-dark">
        <NavBar showBack />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <p className="font-mono text-muted text-sm">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      <NavBar showBack />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1 uppercase tracking-wide">
          {book.title}
        </h1>
        {book.author && (
          <p className="font-mono text-xs text-muted mb-8">{book.author}</p>
        )}
        <ChapterList chapters={book.chapters} bookId={id} progress={progress} />
      </main>
    </div>
  )
}
