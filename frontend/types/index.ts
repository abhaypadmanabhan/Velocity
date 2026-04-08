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

export interface Stats {
  totalBooks: number
  totalWordsRead: number
  avgWpm: number
  chaptersCompleted: number
  overallProgressPercent: number
}

export interface DataPoint {
  date: string
  wpm: number
}

export interface HeatmapCell {
  dayStr: string // "MON", "TUE"
  week: number   // 1, 2, 3, 4
  wpm: number
  retention: number // 0-100
}

export interface AnalyticsData {
  progression: DataPoint[]
  enduranceMins: number
  enduranceSustainedWpm: number
  enduranceVsPrev: number
  heatmap: HeatmapCell[]
}
