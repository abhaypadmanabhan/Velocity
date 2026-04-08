import uuid
import re
import urllib.parse
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.db import get_db
import app.models  # noqa: F401 — ensures all models (incl. ReadingProgress) are registered
from app.models.book import Book, Chapter
from app.schemas.book import BookSchema
from app.services.pdf_parser import parse_pdf
from app.services.storage import delete_pdf, save_pdf

def generate_display_title(parsed_title: str, filename: str) -> str:
    title = parsed_title
    if not title or title.lower() == "untitled" or "http://" in title or "https://" in title:
        title = filename.removesuffix(".pdf")
    
    title = urllib.parse.unquote(title)
    # Remove prefix like 'personal-'
    title = re.sub(r'^personal\s*[-_]?\s*', '', title, flags=re.IGNORECASE)
    title = re.sub(r'[-_]', ' ', title)
    title = re.sub(r'\s+', ' ', title).strip()
    return title.title()

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", response_model=BookSchema)
def upload_book(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    book_id = str(uuid.uuid4())
    file_bytes = file.file.read()
    storage_path = save_pdf(book_id, file_bytes)

    try:
        parsed = parse_pdf(storage_path)
    except Exception:
        delete_pdf(book_id)
        raise HTTPException(status_code=422, detail="Could not parse PDF")

    display_title = generate_display_title(parsed.title, file.filename)

    book = Book(
        id=book_id,
        title=display_title,
        author=parsed.author or None,
        filename=file.filename,
        storage_path=storage_path,
        total_words=len(parsed.all_words),
    )
    db.add(book)
    db.flush()

    word_offset = 0
    for ch in parsed.chapters:
        db.add(Chapter(
            id=str(uuid.uuid4()),
            book_id=book_id,
            title=ch.title,
            index=ch.index,
            word_start=word_offset,
            word_end=word_offset + len(ch.words) - 1,
            words=ch.words,
        ))
        word_offset += len(ch.words)

    db.commit()
    db.refresh(book)
    return book


@router.get("/", response_model=list[BookSchema])
def list_books(db: Session = Depends(get_db)):
    return db.query(Book).all()


@router.get("/{book_id}", response_model=BookSchema)
def get_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.delete("/{book_id}")
def delete_book(book_id: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    delete_pdf(book_id)
    db.delete(book)
    db.commit()
    return {"ok": True}
