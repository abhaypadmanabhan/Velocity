// frontend/types/index.ts
export interface Chapter {
  id: string
  bookId: string
  title: string
  index: number
  wordStart: number
  wordEnd: number
  words: string[]
}

export interface Book {
  id: string
  title: string
  author: string | null
  filename: string
  totalWords: number
  createdAt: string
  chapters: Chapter[]
}

export interface Progress {
  bookId: string
  wordIndex: number
  wpm: number
  lastReadAt: string
}
