# Lessons Learned

## Stitch Asset Retrieval
- Using `mcp_StitchMCP_get_screen` retrieves comprehensive metadata, including hosted URLs for screenshots (`lh3.googleusercontent.com`) and HTML code (`contribution.usercontent.google.com`).
- The `curl -L` utility is effective for downloading these assets directly into the localized workspace.
- Organizing assets in a dedicated subdirectory (e.g., `assets/stitch/`) maintains workspace cleanliness.

## Dashboard UI Integrations
- Refactoring the primary application state to match a complex mock requires preserving critical state components (such as IndexedDB and component reactivity logic) underneath the newly structured presentation components.
- Relying on local data sources (Dexie) can work for Offline-First environments, but it still helps to map backend schemas cleanly via proper Endpoint interfaces to keep the full-stack architecture sound.
