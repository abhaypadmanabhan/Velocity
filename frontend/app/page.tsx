"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertDialog } from "@base-ui/react/alert-dialog"
import { Play, Check, ArrowRight, Trash } from "lucide-react"
import { db } from "@/lib/db"
import { api } from "@/lib/api"
import type { Book, Progress, Stats } from "@/types"
import { NavRail } from "@/components/NavRail"
import { UploadZone } from "@/components/library/upload-zone"
import { getStartChapterIndex } from "@/lib/dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [globalStats, setGlobalStats] = useState<Stats | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null)
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    // Local data
    const stored = await db.books.orderBy("createdAt").reverse().toArray()
    setBooks(stored)
    const allProgress = await db.progress.toArray()
    setProgress(Object.fromEntries(allProgress.map((p) => [p.bookId, p])))

    // Global stats from API
    try {
      const stats = await api.getStats()
      setGlobalStats(stats)
    } catch (e) {
      console.warn("Could not fetch global stats", e)
    }

    // If no active book and books exist, select the first one (or keep null to show global stats)
    // Actually, keeping it null allows seeing global stats by default, which matches reqs.
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const book = await api.uploadBook(file)
      await db.books.put(book)
      await Promise.all(book.chapters.map((ch) => db.chapters.put(ch)))
      setBooks((prev) => [book, ...prev])
      setActiveBookId(book.id)
      loadData() // refresh stats
    } catch {
      setError("Upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (bookId: string) => {
    if (deletingBookId === bookId) return

    setDeletingBookId(bookId)
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
      if (activeBookId === bookId) setActiveBookId(null)
      loadData()
    } catch {
      setError("Delete failed.")
    } finally {
      setDeletingBookId(null)
    }
  }

  const activeBook = books.find(b => b.id === activeBookId)
  const activeProgress = activeBook ? progress[activeBook.id] : null
  const startChapterIndex = activeBook
    ? getStartChapterIndex(activeBook.chapters, activeProgress?.wordIndex ?? null)
    : 0

  // Calculate book specific stats if active
  let bookChaptersCompleted = 0
  let bookProgressPercent = 0
  if (activeBook && activeProgress) {
    const readWords = activeProgress.wordIndex
    bookChaptersCompleted = activeBook.chapters.filter(ch => ch.wordEnd <= readWords).length
    bookProgressPercent = Math.round((readWords / Math.max(1, activeBook.totalWords)) * 100)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden antialiased bg-[#120216] text-white font-display">

      {/* Nav Rail */}
      <NavRail
        onAddClick={() => fileInputRef.current?.click()}
        isUploading={isUploading}
      />
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleUpload(f)
        }}
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[#120216]">
        {/* Gallery */}
        <section className="flex flex-col border-b border-[#4a2c5a] py-8 h-[380px] flex-shrink-0">
          <div className="px-8 mb-4 flex justify-between items-end">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-[#4a2c5a]">Library</h1>
            {error && <span className="text-[#ee1438] font-mono text-sm">{error}</span>}
          </div>

          {books.length === 0 && (
            <div className="px-8 pb-4">
              <UploadZone onUpload={handleUpload} isUploading={isUploading} />
            </div>
          )}

          <div className="flex flex-1 overflow-x-auto snap-x-mandatory px-8 gap-6 pb-4 items-center" style={{ scrollbarWidth: 'none' }}>
            {books.map(book => {
              const isActive = book.id === activeBookId
              return (
                <button
                  key={book.id}
                  onClick={() => setActiveBookId(book.id)}
                  className={`snap-center flex-shrink-0 h-[280px] w-[200px] p-6 flex flex-col justify-between transition-all group ${isActive
                      ? 'bg-white text-[#120216] border border-white transform hover:-translate-y-1'
                      : 'bg-[#1e0824] text-white border border-[#4a2c5a] hover:border-[#ee1438] hover:text-[#ee1438]'
                    }`}
                >
                  <div className="text-left">
                    {isActive && <p className="font-mono text-xs font-bold mb-2 uppercase tracking-widest text-[#ee1438]">Active</p>}
                    <h2 className={`text-2xl font-bold uppercase leading-tight ${!isActive ? 'group-hover:text-[#ee1438] transition-colors' : ''}`}>
                      {book.title}
                    </h2>
                  </div>
                  <div className="text-left mt-auto">
                    <p className={`text-sm font-medium ${isActive ? '' : 'text-[#4a2c5a] group-hover:text-white transition-colors'}`}>
                      {book.author || "Unknown"}
                    </p>
                  </div>
                </button>
              )
            })}
            {books.length === 0 && !isUploading && (
              <div className="h-[280px] w-[200px] border border-dashed border-[#4a2c5a] flex items-center justify-center text-[#4a2c5a]">
                <p className="font-mono text-xs uppercase text-center px-4">Drop a PDF above<br />or use + button</p>
              </div>
            )}
          </div>
        </section>

        {/* Detailed Stats */}
        <section className="flex flex-1 flex-col overflow-hidden">
          {/* Action Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-[#4a2c5a] bg-[#1e0824]/50">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold uppercase tracking-widest text-[#ee1438]">
                {activeBook ? activeBook.title : "Global Overview"}
              </h2>
              {activeBook && <span className="font-mono text-xs text-[#dbb8ff]">{activeBook.author || "Unknown"}</span>}
            </div>

            {activeBook && (
              <div className="flex items-center gap-4">
                <AlertDialog.Root>
                  <AlertDialog.Trigger
                    disabled={deletingBookId === activeBook.id}
                    className="bg-transparent border border-[#ee1438] text-[#ee1438] px-4 py-3 hover:bg-[#ee1438] hover:text-white transition-colors flex items-center disabled:opacity-50"
                    aria-label="Delete PDF"
                  >
                    <Trash className="w-4 h-4" />
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Backdrop
                      className={(state) => `fixed inset-0 z-40 bg-[#120216]/80 ${state.transitionStatus === "starting" ? "animate-in fade-in duration-150" : ""} ${state.transitionStatus === "ending" ? "animate-out fade-out duration-100" : ""}`}
                    />
                    <AlertDialog.Popup
                      className={(state) => `fixed z-50 w-[calc(100%-2rem)] max-w-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#4a2c5a] bg-[#1e0824] p-5 ${state.transitionStatus === "starting" ? "animate-in fade-in zoom-in-95 duration-150" : ""} ${state.transitionStatus === "ending" ? "animate-out fade-out zoom-out-95 duration-100" : ""}`}
                    >
                      <AlertDialog.Title className="font-display font-bold text-lg text-white uppercase tracking-wide">
                        Delete PDF permanently?
                      </AlertDialog.Title>
                      <AlertDialog.Description className="font-mono text-xs text-[#dbb8ff] mt-2 leading-relaxed">
                        This will remove the uploaded PDF and reading progress for this book. This action cannot be undone.
                      </AlertDialog.Description>
                      <div className="mt-5 flex justify-end gap-2">
                        <AlertDialog.Close className="font-mono text-xs uppercase tracking-widest px-3 py-2 border border-[#4a2c5a] text-[#dbb8ff] hover:text-white hover:border-white transition-colors">
                          Cancel
                        </AlertDialog.Close>
                        <AlertDialog.Close
                          onClick={() => handleDelete(activeBook.id)}
                          className="font-mono text-xs uppercase tracking-widest px-3 py-2 border border-[#ee1438] text-[#ee1438] hover:bg-[#ee1438] hover:text-white transition-colors"
                        >
                          {deletingBookId === activeBook.id ? "Deleting..." : "Delete PDF now"}
                        </AlertDialog.Close>
                      </div>
                    </AlertDialog.Popup>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
                <button
                  onClick={() => router.push(`/book/${activeBook.id}/read?chapter=${startChapterIndex}`)}
                  className="bg-[#ee1438] text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#120216] transition-colors flex items-center gap-2"
                >
                  START CHAPTER <Play className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Col: Stats */}
            <div className="w-1/3 border-r border-[#4a2c5a] bg-[#1e0824] p-8 flex flex-col gap-10 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-widest text-[#4a2c5a] mb-2">
                  {activeBook ? "Chapters Completed" : "Total Books"}
                </span>
                <div className="text-5xl font-bold text-white">
                  {activeBook
                    ? <>{bookChaptersCompleted} <span className="text-2xl text-[#4a2c5a]">/ {activeBook.chapters.length}</span></>
                    : globalStats?.totalBooks || 0
                  }
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-widest text-[#4a2c5a] mb-2">Avg WPM</span>
                <div className="text-5xl font-bold text-white border-b-2 border-[#ee1438] inline-block pb-1 self-start">
                  {activeBook ? (activeProgress?.wpm || 0) : globalStats?.avgWpm || 0}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-widest text-[#4a2c5a] mb-2">Overall Progress</span>
                <div className="text-5xl font-bold text-white">
                  {activeBook ? `${bookProgressPercent}%` : `${globalStats?.overallProgressPercent || 0}%`}
                </div>
              </div>
              {!activeBook && (
                <div className="flex flex-col">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#4a2c5a] mb-2">Total Words Read</span>
                  <div className="text-5xl font-bold text-[#dbb8ff]">
                    {globalStats?.totalWordsRead || 0}
                  </div>
                </div>
              )}
              {activeBook && (
                <div className="flex flex-col">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#4a2c5a] mb-2">Retention Est.</span>
                  <div className="text-5xl font-bold text-[#dbb8ff]">92%</div>
                </div>
              )}
            </div>

            {/* Right Col: Chapters or Global Info */}
            <div className="w-2/3 flex flex-col overflow-hidden bg-[#120216]">
              {activeBook ? (
                <>
                  <div className="flex px-8 py-4 border-b border-[#4a2c5a] bg-[#1e0824] font-mono text-xs text-[#4a2c5a] uppercase tracking-widest">
                    <div className="flex-1">Chapter</div>
                    <div className="w-32 text-right">Word Count</div>
                    <div className="w-32 text-right">Est. Time</div>
                  </div>
                  <div className="flex-1 overflow-y-auto font-mono text-sm" style={{ scrollbarWidth: 'none' }}>
                    {activeBook.chapters.map((ch, idx) => {
                      const words = ch.wordEnd - ch.wordStart + 1;
                      const timeMins = activeProgress?.wpm ? Math.ceil(words / activeProgress.wpm) : Math.ceil(words / 250);

                      const isCompleted = ch.wordEnd <= (activeProgress?.wordIndex || 0);
                      const isPending = ch.wordStart > (activeProgress?.wordIndex || 0);
                      const isActive = !isCompleted && !isPending;

                      if (isCompleted) {
                        return (
                          <div key={ch.id} className="flex px-8 py-4 border-b border-[#4a2c5a] items-center hover:bg-[#1e0824] transition-colors cursor-pointer opacity-50 group">
                            <div className="flex-1 flex items-center gap-3">
                              <Check className="w-4 h-4 text-[#ee1438]" />
                              <span className="group-hover:text-[#ee1438] transition-colors font-display text-base">
                                {String(idx + 1).padStart(2, '0')}. {ch.title}
                              </span>
                            </div>
                            <div className="w-32 text-right text-[#4a2c5a]">{words.toLocaleString()}</div>
                            <div className="w-32 text-right text-[#4a2c5a]">{timeMins}m</div>
                          </div>
                        )
                      }
                      if (isActive) {
                        return (
                          <div key={ch.id} className="flex px-8 py-4 border-b border-[#ee1438] bg-[#1e0824] items-center cursor-pointer">
                            <div className="flex-1 flex items-center gap-3">
                              <ArrowRight className="w-4 h-4 text-[#ee1438] animate-pulse" />
                              <span className="text-[#ee1438] font-display font-bold text-base">
                                {String(idx + 1).padStart(2, '0')}. {ch.title}
                              </span>
                            </div>
                            <div className="w-32 text-right text-white">{words.toLocaleString()}</div>
                            <div className="w-32 text-right text-[#dbb8ff] font-bold">{timeMins}m</div>
                          </div>
                        )
                      }
                      return (
                        <div key={ch.id} className="flex px-8 py-4 border-b border-[#4a2c5a] items-center hover:bg-[#1e0824] transition-colors cursor-pointer group">
                          <div className="flex-1 flex items-center gap-3 pl-7">
                            <span className="group-hover:text-[#ee1438] transition-colors font-display text-base text-white">
                              {String(idx + 1).padStart(2, '0')}. {ch.title}
                            </span>
                          </div>
                          <div className="w-32 text-right text-[#4a2c5a]">{words.toLocaleString()}</div>
                          <div className="w-32 text-right text-white group-hover:text-[#dbb8ff] transition-colors">{timeMins}m</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-12 text-center text-[#4a2c5a]">
                  <div>
                    <h3 className="font-display font-bold text-2xl uppercase tracking-widest text-[#4a2c5a] mb-4">No Book Selected</h3>
                    <p className="font-mono text-sm max-w-sm mx-auto">
                      Select a book from the library gallery above to view its chapter architecture and progress stats, or use the Add button to upload a new PDF.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
