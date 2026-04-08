// frontend/app/book/[id]/read/page.tsx
"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { NavBar } from "@/components/shared/nav-bar"
import { ChapterHeader } from "@/components/reader/chapter-header"
import { ProgressBar } from "@/components/reader/progress-bar"
import { RSVPDisplay } from "@/components/reader/rsvp-display"
import { ContextSnippet } from "@/components/reader/context-snippet"
import { WPMSlider } from "@/components/reader/wpm-slider"
import { ReaderControls } from "@/components/reader/reader-controls"
import { db } from "@/lib/db"
import { api } from "@/lib/api"
import { useRSVP } from "@/hooks/use-rsvp"
import type { Book, Chapter } from "@/types"

const AUTOSAVE_EVERY = 30 // words
const SYNC_EVERY_MS = 60_000

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [book, setBook] = useState<Book | null>(null)
  const [allWords, setAllWords] = useState<string[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [initialIndex, setInitialIndex] = useState(0)
  const [initialWpm, setInitialWpm] = useState(250)
  const [showComplete, setShowComplete] = useState(false)

  const lastSavedRef = useRef(0)
  const lastSyncRef = useRef(Date.now())
  const stateRef = useRef({ currentIndex: 0, wpm: 250, isPlaying: false })

  // Load book + chapters + progress from IndexedDB
  useEffect(() => {
    async function load() {
      const stored = await db.books.get(id)
      if (!stored) return

      const chs = await db.chapters.where("bookId").equals(id).sortBy("index")
      const words = chs.flatMap((ch) => ch.words)

      setBook(stored)
      setChapters(chs)
      setAllWords(words)

      const progress = await db.progress.get(id)
      const targetChapterIdx = parseInt(searchParams.get("chapter") ?? "0", 10)
      const targetChapter = chs.find((c) => c.index === targetChapterIdx) ?? chs[0]

      if (progress && progress.wordIndex >= (targetChapter?.wordStart ?? 0) && progress.wordIndex <= (targetChapter?.wordEnd ?? Infinity)) {
        setInitialIndex(progress.wordIndex)
        setInitialWpm(progress.wpm)
      } else if (targetChapter) {
        setInitialIndex(targetChapter.wordStart)
        if (progress) setInitialWpm(progress.wpm)
      }
    }
    load()
  }, [id, searchParams])

  const { state, play, pause, seek, setWpm, getOrpParts } = useRSVP(
    allWords,
    initialIndex,
    initialWpm
  )

  // Keep stateRef current so unmount effect can read latest values
  useEffect(() => { stateRef.current = state }, [state])

  const currentChapter = useMemo(() => {
    return chapters.find(
      (ch) => state.currentIndex >= ch.wordStart && state.currentIndex <= ch.wordEnd
    ) ?? chapters[0]
  }, [chapters, state.currentIndex])

  // Autosave progress every AUTOSAVE_EVERY words
  const saveProgress = useCallback(async (wordIndex: number, wpm: number) => {
    await db.progress.put({
      bookId: id,
      wordIndex,
      wpm,
      lastReadAt: new Date().toISOString(),
    })
    const now = Date.now()
    if (now - lastSyncRef.current > SYNC_EVERY_MS) {
      lastSyncRef.current = now
      api.updateProgress(id, { wordIndex, wpm }).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (state.currentIndex - lastSavedRef.current >= AUTOSAVE_EVERY) {
      lastSavedRef.current = state.currentIndex
      saveProgress(state.currentIndex, state.wpm)
    }
    if (!state.isPlaying && state.currentIndex >= allWords.length - 1 && allWords.length > 0) {
      setShowComplete(true)
    }
  }, [state, allWords.length, saveProgress])

  // Save on unmount — reads from stateRef to avoid stale closure
  useEffect(() => {
    return () => {
      if (stateRef.current.currentIndex > 0) {
        saveProgress(stateRef.current.currentIndex, stateRef.current.wpm)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case " ":
          e.preventDefault()
          if (state.isPlaying) {
            pause()
          } else {
            play()
          }
          break
        case "ArrowLeft":
          seek(Math.max(0, state.currentIndex - 10))
          break
        case "ArrowRight":
          seek(Math.min(allWords.length - 1, state.currentIndex + 10))
          break
        case "[":
          setWpm(Math.max(100, state.wpm - 50))
          break
        case "]":
          setWpm(Math.min(1000, state.wpm + 50))
          break
        case "Escape":
          router.push(`/book/${id}`)
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [state, play, pause, seek, setWpm, router, id, allWords.length])

  const currentWord = allWords[state.currentIndex] ?? ""
  const orpParts = getOrpParts(currentWord)

  if (!book || allWords.length === 0) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <p className="font-mono text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      <ProgressBar current={state.currentIndex} total={allWords.length} />
      <NavBar showBack />
      {currentChapter && (
        <ChapterHeader
          title={currentChapter.title}
          index={currentChapter.index}
          total={chapters.length}
        />
      )}

      {/* RSVP focal area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <RSVPDisplay word={currentWord} orpParts={orpParts} />
        <div className="w-full max-w-2xl mt-6">
          <ContextSnippet words={allWords} currentIndex={state.currentIndex} />
        </div>
      </div>

      {/* Controls pinned to bottom */}
      <div className="border-t border-muted bg-surface">
        <WPMSlider wpm={state.wpm} onChange={setWpm} />
        <ReaderControls
          isPlaying={state.isPlaying}
          onPlay={play}
          onPause={pause}
          onBack={() => seek(Math.max(0, state.currentIndex - 10))}
          onForward={() => seek(Math.min(allWords.length - 1, state.currentIndex + 10))}
        />
      </div>

      {/* Chapter complete overlay */}
      {showComplete && (
        <div className="fixed inset-0 bg-bg-dark/90 flex flex-col items-center justify-center gap-6 z-50">
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Chapter Complete
          </h2>
          {currentChapter && currentChapter.index < chapters.length - 1 ? (
            <button
              onClick={() => {
                setShowComplete(false)
                const nextCh = chapters.find((c) => c.index === currentChapter.index + 1)
                if (nextCh) { seek(nextCh.wordStart); play() }
              }}
              className="font-mono text-sm uppercase tracking-widest px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Next Chapter →
            </button>
          ) : null}
          <button
            onClick={() => router.push(`/book/${id}`)}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-white transition-colors"
          >
            Back to Library
          </button>
        </div>
      )}
    </div>
  )
}
