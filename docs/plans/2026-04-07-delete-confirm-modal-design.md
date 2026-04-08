# Delete Confirmation Modal Design

## Goal

Replace native `window.confirm` with an in-app styled confirmation modal for PDF deletion.

## Approach

Use `@base-ui/react` `AlertDialog` primitives inside each `BookCard` delete action.

- Delete button opens modal.
- Modal content explains permanent deletion of PDF and progress.
- Actions: `Cancel` and `Delete PDF`.
- Confirm calls existing `onDelete(bookId)` callback.

## Why this approach

- Matches existing UI stack (`@base-ui/react` already in use).
- Improves accessibility over custom modal implementation.
- Keeps server-first delete flow unchanged in `frontend/app/page.tsx`.

## Data and state impact

- No backend changes.
- No API changes.
- No IndexedDB flow changes.
- Only confirmation interaction moves from browser native dialog to app UI.

## Tests

- Update `BookCard` test to verify:
  - clicking `Delete` opens modal and does not immediately call `onDelete`
  - clicking `Delete PDF` in modal calls `onDelete(bookId)`
