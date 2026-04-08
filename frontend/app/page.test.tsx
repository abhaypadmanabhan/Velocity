import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import DashboardPage from "./page"
import type { Book, Progress, Stats } from "@/types"

const pushMock = vi.hoisted(() => vi.fn())
const booksToArrayMock = vi.hoisted(() => vi.fn())
const progressToArrayMock = vi.hoisted(() => vi.fn())
const transactionMock = vi.hoisted(() => vi.fn())
const deleteBookMock = vi.hoisted(() => vi.fn())
const statsMock = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
}))

vi.mock("@/components/NavRail", () => ({
  NavRail: ({ onAddClick }: { onAddClick?: () => void }) => (
    <button onClick={onAddClick} type="button">Add</button>
  ),
}))

vi.mock("@/lib/api", () => ({
  api: {
    getStats: statsMock,
    deleteBook: deleteBookMock,
    uploadBook: vi.fn(),
    updateProgress: vi.fn(),
  },
}))

vi.mock("@/lib/db", () => ({
  db: {
    books: {
      orderBy: vi.fn(() => ({
        reverse: () => ({
          toArray: booksToArrayMock,
        }),
      })),
      delete: vi.fn(),
      put: vi.fn(),
    },
    progress: {
      toArray: progressToArrayMock,
      delete: vi.fn(),
    },
    chapters: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn(),
        })),
      })),
      put: vi.fn(),
    },
    transaction: transactionMock,
  },
}))

const sampleBook: Book = {
  id: "b1",
  title: "Book One",
  author: "Author One",
  filename: "book-one.pdf",
  totalWords: 300,
  createdAt: "2026-01-01T00:00:00.000Z",
  chapters: [
    { id: "c1", bookId: "b1", title: "Ch 1", index: 0, wordStart: 0, wordEnd: 99, words: [] },
    { id: "c2", bookId: "b1", title: "Ch 2", index: 1, wordStart: 100, wordEnd: 199, words: [] },
    { id: "c3", bookId: "b1", title: "Ch 3", index: 2, wordStart: 200, wordEnd: 299, words: [] },
  ],
}

const baseStats: Stats = {
  totalBooks: 1,
  totalWordsRead: 0,
  avgWpm: 250,
  chaptersCompleted: 0,
  overallProgressPercent: 0,
}

describe("Dashboard regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsMock.mockResolvedValue(baseStats)
    transactionMock.mockImplementation(async (_mode: string, ...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<void>
      await callback()
    })
  })

  it("shows drop upload zone when library is empty", async () => {
    booksToArrayMock.mockResolvedValue([])
    progressToArrayMock.mockResolvedValue([])

    render(<DashboardPage />)

    expect(await screen.findByText(/drop pdf or click to upload/i)).toBeInTheDocument()
  })

  it("navigates to RSVP page when start chapter is clicked", async () => {
    const progress: Progress = {
      bookId: "b1",
      wordIndex: 150,
      wpm: 300,
      lastReadAt: "2026-01-01T00:00:00.000Z",
    }

    booksToArrayMock.mockResolvedValue([sampleBook])
    progressToArrayMock.mockResolvedValue([progress])

    render(<DashboardPage />)

    fireEvent.click(await screen.findByRole("button", { name: /book one/i }))
    fireEvent.click(screen.getByRole("button", { name: /start chapter/i }))

    expect(pushMock).toHaveBeenCalledWith("/book/b1/read?chapter=1")
  })

  it("requires confirmation before deleting the selected pdf", async () => {
    booksToArrayMock.mockResolvedValue([sampleBook])
    progressToArrayMock.mockResolvedValue([])

    render(<DashboardPage />)

    fireEvent.click(await screen.findByRole("button", { name: /book one/i }))
    fireEvent.click(screen.getByRole("button", { name: /delete pdf/i }))

    expect(deleteBookMock).not.toHaveBeenCalled()
    expect(await screen.findByText(/delete pdf permanently\?/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /delete pdf now/i }))

    await waitFor(() => {
      expect(deleteBookMock).toHaveBeenCalledWith("b1")
    })
  })
})
