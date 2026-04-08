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
          <BookGrid books={books} progress={progress} />
        </div>
      </main>
    </div>
  )
}
