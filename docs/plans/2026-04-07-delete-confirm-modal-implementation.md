# Delete Confirm Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace browser-native delete confirmation with an in-app accessible modal while preserving server-first delete behavior.

**Architecture:** Keep delete ownership in `LibraryPage` and render confirmation UI in each `BookCard` via `@base-ui/react` `AlertDialog`. `BookCard` confirms intent then calls existing `onDelete(bookId)` callback. Backend/API/local deletion flow remains unchanged.

**Tech Stack:** Next.js App Router, React 19, TypeScript, @base-ui/react AlertDialog, Vitest, Testing Library

---

### Task 1: Update BookCard test for modal flow

**Files:**
- Modify: `frontend/components/library/book-card.test.tsx`

**Step 1: Write failing test**
- Assert clicking `Delete` opens modal content and does not call `onDelete` yet.
- Assert clicking `Delete PDF` in modal calls `onDelete(bookId)`.

**Step 2: Run test to verify it fails**
- Run: `npm test -- components/library/book-card.test.tsx`
- Expected: FAIL because current card calls `onDelete` immediately.

### Task 2: Implement AlertDialog in BookCard

**Files:**
- Modify: `frontend/components/library/book-card.tsx`

**Step 1: Add modal primitives**
- Import `AlertDialog` from `@base-ui/react/alert-dialog`.
- Wrap existing delete action as dialog trigger.

**Step 2: Add popup/backdrop/actions**
- Include title/description warning.
- Buttons: `Cancel` and `Delete PDF`.
- Confirm calls `onDelete(book.id)`.

**Step 3: Preserve existing deleting state**
- Keep `isDeleting` text/disable behavior to prevent duplicate actions.

### Task 3: Verify tests and behavior

**Files:**
- Test: `frontend/components/library/book-card.test.tsx`
- Test: `frontend/lib/api.test.ts`

**Step 1: Run focused tests**
- Run: `npm test -- components/library/book-card.test.tsx lib/api.test.ts`
- Expected: PASS.

**Step 2: Quick lint check for touched files**
- Run: `npm run lint`
- Expected: no new errors from changed files.
