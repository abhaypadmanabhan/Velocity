"use client"
import { useEffect, useState, useCallback } from "react"
import { NavBar } from "@/components/shared/nav-bar"
import { UploadZone } from "@/components/library/upload-zone"
import { BookGrid } from "@/components/library/book-grid"
import { db } from "@/lib/db"
import { api } from "@/lib/api"
import type { Book, Progress } from "@/types"

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [deletingBookIds, setDeletingBookIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const loadBooks = useCallback(async () => {
    const stored = await db.books.orderBy("createdAt").reverse().toArray()
    setBooks(stored)
    const allProgress = await db.progress.toArray()
    setProgress(Object.fromEntries(allProgress.map((p) => [p.bookId, p])))
  }, [])

  useEffect(() => { loadBooks() }, [loadBooks])

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const book = await api.uploadBook(file)
      await db.books.put(book)
      await Promise.all(book.chapters.map((ch) => db.chapters.put(ch)))
      setBooks((prev) => [book, ...prev])
    } catch (err) {
      setError("Upload failed. Make sure the backend is running at localhost:8000.")
      console.error("Upload failed:", err)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleDelete = useCallback(async (bookId: string) => {
    if (deletingBookIds.has(bookId)) return

    setError(null)
    setDeletingBookIds((prev) => new Set(prev).add(bookId))

    try {
      await api.deleteBook(bookId)
      await db.transaction("rw", db.books, db.chapters, db.progress, async () => {
        await db.books.delete(bookId)
        await db.chapters.where("bookId").equals(bookId).delete()
        await db.progress.delete(bookId)
      })
      setBooks((prev) => prev.filter((book) => book.id !== bookId))
      setProgress((prev) => {
        const next = { ...prev }
        delete next[bookId]
        return next
      })
    } catch (err) {
      setError("Delete failed. Please try again.")
      console.error("Delete failed:", err)
    } finally {
      setDeletingBookIds((prev) => {
        const next = new Set(prev)
        next.delete(bookId)
        return next
      })
    }
  }, [deletingBookIds])

  return (
    <div className="min-h-screen bg-bg-dark">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-white mb-8 uppercase tracking-wide">
          Library
        </h1>
        <UploadZone onUpload={handleUpload} isUploading={isUploading} />
        {error && (
          <p className="font-mono text-xs text-primary mt-3">{error}</p>
        )}
        <div className="mt-8">
          <BookGrid
            books={books}
            progress={progress}
            deletingBookIds={deletingBookIds}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  )
}
