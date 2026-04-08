# Lessons Learned

## Stitch Asset Retrieval
- Using `mcp_StitchMCP_get_screen` retrieves comprehensive metadata, including hosted URLs for screenshots (`lh3.googleusercontent.com`) and HTML code (`contribution.usercontent.google.com`).
- The `curl -L` utility is effective for downloading these assets directly into the localized workspace.
- Organizing assets in a dedicated subdirectory (e.g., `assets/stitch/`) maintains workspace cleanliness.
