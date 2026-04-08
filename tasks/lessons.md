# Lessons Learned

## Stitch Asset Retrieval
- Using `mcp_StitchMCP_get_screen` retrieves comprehensive metadata, including hosted URLs for screenshots (`lh3.googleusercontent.com`) and HTML code (`contribution.usercontent.google.com`).
- The `curl -L` utility is effective for downloading these assets directly into the localized workspace.
- Organizing assets in a dedicated subdirectory (e.g., `assets/stitch/`) maintains workspace cleanliness.

## Dashboard UI Integrations
- Refactoring the primary application state to match a complex mock requires preserving critical state components (such as IndexedDB and component reactivity logic) underneath the newly structured presentation components.
- Relying on local data sources (Dexie) can work for Offline-First environments, but it still helps to map backend schemas cleanly via proper Endpoint interfaces to keep the full-stack architecture sound.

## PDF Parsing & Ingestion
- Document metadata (like PDF Titles) can often be noisy, containing URL fragments or tracking prefixes. Always sanitize and clean display titles with a robust string processing layer (e.g. `urllib.parse.unquote`, stripping artifacts) before saving them to the database.
- For lengthy, unstructured documents where programmatic heuristics fail to find chapters, do not fall back to a single massive "Full Document." Artificial word-count chunking guarantees predictable application performance and a manageable User Experience.

## API Prototyping & Backend Mocking
- When integrating a new complex frontend view (like Cognitive Analytics) that requires historical aggregation, build out a simulated endpoint on the backend initialized from current global statistics rather than pushing mock logic onto the frontend. This ensures the frontend `api.ts` consumer logic stays pure and ready for an eventual DB migration when true historical models (`ReadingSession`) are added.

## React Hooks & State Consistency
- **Bug:** The RSVP Reader initialized its `initialIndex` from 0, never adopting the user's saved progress index because asynchronous parameter fetching meant `initialIndex` changed post-mount. But since `initialIndex` wasn't tracked properly in `useRSVP`'s dependency arrays, the closure wrapped around the stale 0 index, causing the reader to silently lock / immediately finish and never properly play the word stream. 
- **Bug 2:** Pressing "Reread" or "Read" on an earlier chapter incorrectly started the reader at the end of the entire book, instead of the start of the chapter, because the condition mapping progress checked if the `wordIndex >= targetChapter.wordStart` without bounding it on the upper end (`<= targetChapter.wordEnd`).
- **Lesson:** Always synchronize internal hook state (like `engine`) with outer React state immediately upon recreation, and ensure any condition bounding "current progress" within an arbitrary chapter encapsulates both the minimum AND maximum ranges to prevent "jumping forward" to future chapters.
- **Rule:** Never use an asynchronous derived prop (like `initialIndex`) as the initial state for a hook/state without putting it in a dependency array or properly handling re-initialization.
