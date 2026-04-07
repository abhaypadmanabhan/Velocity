from pathlib import Path
from app.db import settings


def _storage_dir() -> Path:
    p = Path(settings.storage_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_pdf(book_id: str, file_bytes: bytes) -> str:
    path = _storage_dir() / f"{book_id}.pdf"
    path.write_bytes(file_bytes)
    return str(path)


def get_pdf_path(book_id: str) -> Path:
    return _storage_dir() / f"{book_id}.pdf"


def delete_pdf(book_id: str) -> None:
    path = _storage_dir() / f"{book_id}.pdf"
    if path.exists():
        path.unlink()
