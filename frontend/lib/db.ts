// frontend/lib/db.ts
import Dexie, { Table } from "dexie"
import type { Book, Chapter, Progress } from "@/types"

class VelocityDB extends Dexie {
  books!: Table<Book, string>
  chapters!: Table<Chapter, string>
  progress!: Table<Progress, string>

  constructor() {
    super("velocity")
    this.version(1).stores({
      books: "id, title, createdAt",
      chapters: "id, bookId, index",
      progress: "bookId",
    })
  }
}

export const db = new VelocityDB()
