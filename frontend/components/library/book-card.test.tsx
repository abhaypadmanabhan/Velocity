import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { BookCard } from "./book-card"
import type { Book } from "@/types"

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const book: Book = {
  id: "b1",
  title: "Test Book",
  author: "Author",
  filename: "test.pdf",
  totalWords: 200,
  createdAt: "2026-01-01T00:00:00.000Z",
  chapters: [],
}

describe("BookCard", () => {
  it("confirms delete in modal before calling onDelete", () => {
    const onDelete = vi.fn()

    render(<BookCard book={book} progress={null} onDelete={onDelete} isDeleting={false} />)

    fireEvent.click(screen.getByRole("button", { name: /delete pdf/i }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText(/delete pdf permanently\?/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /delete pdf now/i }))

    expect(onDelete).toHaveBeenCalledWith("b1")
  })
})
