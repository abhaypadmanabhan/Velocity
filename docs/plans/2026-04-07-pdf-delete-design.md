# PDF Delete Feature Design

## Goal

Allow users to permanently delete uploaded PDFs they no longer need so backend storage and associated reading data are removed.

## Chosen Approach

Server-first hard delete (Approach A).

1. User clicks delete on a Library card.
2. UI asks for confirmation.
3. Frontend calls `DELETE /books/{book_id}`.
4. On success, frontend deletes local IndexedDB records for that book.
5. UI removes the card from state.

This ensures remote storage cleanup is the source of truth and avoids local/remote drift.

## UX

- Add a per-card delete action on `BookCard`.
- Disable delete while request is in-flight (`Deleting...`).
- Confirm text warns that PDF and progress are permanently removed.
- On failure, keep card and show inline error message.

## Data Flow

- Library page owns delete orchestration.
- After API success, remove local data in a Dexie transaction:
  - `db.books.delete(bookId)`
  - `db.chapters.where("bookId").equals(bookId).delete()`
  - `db.progress.delete(bookId)`
- Sync in-memory React state (`books` and `progress`) after local delete.

## Error Handling

- If API fails, local data is untouched.
- UI error: `Delete failed. Please try again.`
- Duplicate click prevention using a per-book deleting state set.

## Testing

- Frontend:
  - `api.deleteBook` issues `DELETE /books/:id`.
  - `BookCard` delete action calls `onDelete(bookId)`.
- Backend:
  - `test_delete_book` ensures endpoint still deletes records and returns success.
