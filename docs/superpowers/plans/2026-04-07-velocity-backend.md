# Velocity Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI backend that accepts PDF uploads, parses them into chapters and word arrays using pymupdf, persists them to SQLite, and exposes REST endpoints for books and reading progress.

**Architecture:** Single FastAPI app with SQLAlchemy ORM (SQLite dev / Postgres prod). PDF is parsed on upload — chapters and their word arrays stored as JSON. Progress is upserted via PUT. No auth for MVP.

**Tech Stack:** Python 3.11+, FastAPI 0.111, SQLAlchemy 2.0, pymupdf 1.24, pydantic-settings 2.2, pytest + httpx TestClient, SQLite.

---

## File Map

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, router registration, table creation
│   ├── db.py                # Settings, engine, SessionLocal, Base, get_db
│   ├── models/
│   │   ├── __init__.py
│   │   ├── book.py          # Book + Chapter ORM models (Chapter.words = JSON column)
│   │   └── progress.py      # ReadingProgress ORM model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── book.py          # BookSchema, ChapterSchema, BookCreate
│   │   └── progress.py      # ProgressSchema, ProgressUpdate
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── books.py         # POST /books, GET /books, GET /books/{id}, DELETE /books/{id}
│   │   └── progress.py      # GET /books/{id}/progress, PUT /books/{id}/progress
│   └── services/
│       ├── __init__.py
│       ├── storage.py       # save_pdf(), get_pdf_path(), delete_pdf()
│       └── pdf_parser.py    # parse_pdf() → ParsedBook with chapters + word arrays
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # test DB, temp storage, TestClient fixture
│   ├── test_storage.py
│   ├── test_pdf_parser.py
│   ├── test_books.py
│   └── test_progress.py
├── requirements.txt
├── .env.example
└── run.py
```

---

### Task 1: Scaffold backend directory and dependencies

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/run.py`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/db.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p backend/app/models backend/app/schemas backend/app/routers backend/app/services backend/tests
touch backend/app/__init__.py backend/app/models/__init__.py backend/app/schemas/__init__.py
touch backend/app/routers/__init__.py backend/app/services/__init__.py
touch backend/tests/__init__.py
```

- [ ] **Step 2: Write requirements.txt**

```
# backend/requirements.txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
pymupdf==1.24.3
python-multipart==0.0.9
pydantic-settings==2.2.1
pytest==8.2.0
httpx==0.27.0
pytest-asyncio==0.23.6
aiofiles==23.2.1
```

- [ ] **Step 3: Write .env.example**

```
# backend/.env.example
DATABASE_URL=sqlite:///./velocity.db
STORAGE_DIR=./storage
```

- [ ] **Step 4: Write app/db.py**

```python
# backend/app/db.py
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./velocity.db"
    storage_dir: str = "./storage"

    class Config:
        env_file = ".env"


settings = Settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: Write app/main.py skeleton**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Velocity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 6: Write run.py**

```python
# backend/run.py
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

- [ ] **Step 7: Write tests/conftest.py**

```python
# backend/tests/conftest.py
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db import Base, get_db, settings

TEST_DB_URL = "sqlite:///./test_velocity.db"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_db(tmp_path):
    # Point storage to temp dir for each test
    settings.storage_dir = str(tmp_path / "storage")
    os.makedirs(settings.storage_dir, exist_ok=True)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 8: Install dependencies and verify import**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -c "from app.main import app; print('OK')"
```

Expected output: `OK`

- [ ] **Step 9: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend with FastAPI, SQLAlchemy, and test fixtures"
```

---

### Task 2: Database models

**Files:**
- Create: `backend/app/models/book.py`
- Create: `backend/app/models/progress.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_models.py
from app.models.book import Book, Chapter
from app.models.progress import ReadingProgress


def test_book_chapter_relationship(db):
    book = Book(
        id="b1", title="Test Book", author="Author",
        filename="test.pdf", storage_path="/tmp/test.pdf", total_words=3,
    )
    db.add(book)
    db.flush()

    chapter = Chapter(
        id="c1", book_id="b1", title="Chapter 1",
        index=0, word_start=0, word_end=2, words=["hello", "world", "test"],
    )
    db.add(chapter)
    db.commit()

    fetched = db.query(Book).filter_by(id="b1").first()
    assert fetched.title == "Test Book"
    assert len(fetched.chapters) == 1
    assert fetched.chapters[0].words == ["hello", "world", "test"]


def test_progress_defaults(db):
    progress = ReadingProgress(book_id="b1", word_index=42, wpm=300)
    db.add(progress)
    db.commit()

    fetched = db.query(ReadingProgress).filter_by(book_id="b1").first()
    assert fetched.word_index == 42
    assert fetched.wpm == 300
    assert fetched.last_read_at is not None
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && pytest tests/test_models.py -v
```

Expected: `ImportError` — models not defined yet.

- [ ] **Step 3: Write app/models/book.py**

```python
# backend/app/models/book.py
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=True)
    filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    total_words = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    chapters = relationship(
        "Chapter", back_populates="book",
        cascade="all, delete-orphan", order_by="Chapter.index",
    )
    progress = relationship(
        "ReadingProgress", back_populates="book",
        uselist=False, cascade="all, delete-orphan",
    )


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String, primary_key=True)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    title = Column(String, nullable=False)
    index = Column(Integer, nullable=False)
    word_start = Column(Integer, nullable=False)
    word_end = Column(Integer, nullable=False)
    words = Column(JSON, nullable=False, default=list)

    book = relationship("Book", back_populates="chapters")
```

- [ ] **Step 4: Write app/models/progress.py**

```python
# backend/app/models/progress.py
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base


class ReadingProgress(Base):
    __tablename__ = "progress"

    book_id = Column(String, ForeignKey("books.id"), primary_key=True)
    word_index = Column(Integer, default=0)
    wpm = Column(Integer, default=250)
    last_read_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="progress")
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd backend && pytest tests/test_models.py -v
```

Expected: `2 passed`

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/ backend/tests/test_models.py
git commit -m "feat: add Book, Chapter, ReadingProgress ORM models"
```

---

### Task 3: Pydantic schemas

**Files:**
- Create: `backend/app/schemas/book.py`
- Create: `backend/app/schemas/progress.py`

- [ ] **Step 1: Write app/schemas/book.py**

```python
# backend/app/schemas/book.py
from datetime import datetime
from pydantic import BaseModel


class ChapterSchema(BaseModel):
    id: str
    book_id: str
    title: str
    index: int
    word_start: int
    word_end: int
    words: list[str] = []

    model_config = {"from_attributes": True}


class BookSchema(BaseModel):
    id: str
    title: str
    author: str | None
    filename: str
    total_words: int
    created_at: datetime
    chapters: list[ChapterSchema] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Write app/schemas/progress.py**

```python
# backend/app/schemas/progress.py
from datetime import datetime
from pydantic import BaseModel


class ProgressUpdate(BaseModel):
    word_index: int
    wpm: int


class ProgressSchema(BaseModel):
    book_id: str
    word_index: int
    wpm: int
    last_read_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Verify schemas parse correctly**

```bash
cd backend && python -c "
from app.schemas.book import BookSchema, ChapterSchema
ch = ChapterSchema(id='c1', book_id='b1', title='Ch 1', index=0, word_start=0, word_end=2, words=['a','b','c'])
print(ch.model_dump())
"
```

Expected: dict with all fields printed, no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic schemas for books and progress"
```

---

### Task 4: Storage service

**Files:**
- Create: `backend/app/services/storage.py`
- Create: `backend/tests/test_storage.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_storage.py
from app.services.storage import save_pdf, get_pdf_path, delete_pdf


def test_save_and_retrieve_pdf(tmp_path):
    from app.db import settings
    settings.storage_dir = str(tmp_path)

    data = b"%PDF-1.4 fake content"
    path = save_pdf("book-123", data)

    assert get_pdf_path("book-123").exists()
    assert get_pdf_path("book-123").read_bytes() == data


def test_delete_pdf(tmp_path):
    from app.db import settings
    settings.storage_dir = str(tmp_path)

    save_pdf("book-456", b"data")
    assert get_pdf_path("book-456").exists()

    delete_pdf("book-456")
    assert not get_pdf_path("book-456").exists()


def test_delete_nonexistent_pdf_is_noop(tmp_path):
    from app.db import settings
    settings.storage_dir = str(tmp_path)

    delete_pdf("does-not-exist")  # should not raise
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && pytest tests/test_storage.py -v
```

Expected: `ImportError` — storage module not defined.

- [ ] **Step 3: Write app/services/storage.py**

```python
# backend/app/services/storage.py
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd backend && pytest tests/test_storage.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/storage.py backend/tests/test_storage.py
git commit -m "feat: add PDF storage service"
```

---

### Task 5: PDF parser service

**Files:**
- Create: `backend/app/services/pdf_parser.py`
- Create: `backend/tests/test_pdf_parser.py`

- [ ] **Step 1: Write failing test**

```python
# backend/tests/test_pdf_parser.py
import fitz
import pytest
from app.services.pdf_parser import parse_pdf, ParsedBook, ParsedChapter


def make_pdf(tmp_path, pages: list[str], title="Test", author="Auth") -> str:
    path = str(tmp_path / "test.pdf")
    doc = fitz.open()
    doc.set_metadata({"title": title, "author": author})
    for text in pages:
        page = doc.new_page()
        page.insert_text((50, 72), text, fontsize=12)
    doc.save(path)
    doc.close()
    return path


def test_parse_returns_parsed_book(tmp_path):
    path = make_pdf(tmp_path, ["Hello world this is the first page"])
    result = parse_pdf(path)

    assert isinstance(result, ParsedBook)
    assert result.title == "Test"
    assert result.author == "Auth"
    assert len(result.chapters) >= 1
    assert len(result.all_words) > 0


def test_all_words_flattens_chapters(tmp_path):
    path = make_pdf(tmp_path, ["one two three", "four five six"])
    result = parse_pdf(path)

    total = sum(len(ch.words) for ch in result.chapters)
    assert total == len(result.all_words)


def test_empty_words_filtered(tmp_path):
    path = make_pdf(tmp_path, ["  hello   world  "])
    result = parse_pdf(path)

    for ch in result.chapters:
        for word in ch.words:
            assert word.strip() != ""
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend && pytest tests/test_pdf_parser.py -v
```

Expected: `ImportError` — pdf_parser not defined.

- [ ] **Step 3: Write app/services/pdf_parser.py**

```python
# backend/app/services/pdf_parser.py
import re
from dataclasses import dataclass, field
import fitz


@dataclass
class ParsedChapter:
    title: str
    index: int
    words: list[str] = field(default_factory=list)


@dataclass
class ParsedBook:
    title: str
    author: str
    chapters: list[ParsedChapter] = field(default_factory=list)
    all_words: list[str] = field(default_factory=list)


def _fix_hyphenation(text: str) -> str:
    return re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)


def _split_words(text: str) -> list[str]:
    return [w for w in text.split() if w.strip() and w.strip() not in {"-", "–", "—"}]


def parse_pdf(path: str) -> ParsedBook:
    doc = fitz.open(path)
    title = doc.metadata.get("title") or "Untitled"
    author = doc.metadata.get("author") or ""

    toc = doc.get_toc()  # [[level, title, page_number], ...]
    chapters = _parse_with_toc(doc, toc) if toc else _parse_with_heuristics(doc)

    if not chapters:
        full_text = _fix_hyphenation("".join(p.get_text() for p in doc))
        chapters = [ParsedChapter(title="Full Document", index=0, words=_split_words(full_text))]

    all_words: list[str] = []
    for ch in chapters:
        all_words.extend(ch.words)

    doc.close()
    return ParsedBook(title=title, author=author, chapters=chapters, all_words=all_words)


def _parse_with_toc(doc: fitz.Document, toc: list) -> list[ParsedChapter]:
    entries = [(t, p) for lvl, t, p in toc if lvl == 1] or [(t, p) for _, t, p in toc]
    chapters: list[ParsedChapter] = []

    for i, (ch_title, start_page) in enumerate(entries):
        end_page = entries[i + 1][1] - 1 if i + 1 < len(entries) else len(doc)
        pages = range(max(0, start_page - 1), min(end_page, len(doc)))
        text = _fix_hyphenation("".join(doc[p].get_text() for p in pages))
        words = _split_words(text)
        if words:
            chapters.append(ParsedChapter(title=ch_title, index=i, words=words))

    return chapters


def _parse_with_heuristics(doc: fitz.Document) -> list[ParsedChapter]:
    heading_re = re.compile(r"^(chapter|part|section)\s+\w+", re.IGNORECASE)
    chapters: list[ParsedChapter] = []
    current_title = "Introduction"
    current_words: list[str] = []
    idx = 0

    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                line_text = " ".join(s["text"] for s in line["spans"]).strip()
                if not line_text:
                    continue
                max_size = max((s["size"] for s in line["spans"]), default=0)
                is_heading = len(line_text) < 80 and max_size >= 14 and heading_re.match(line_text)
                if is_heading and current_words:
                    chapters.append(ParsedChapter(title=current_title, index=idx, words=current_words))
                    idx += 1
                    current_title = line_text
                    current_words = []
                else:
                    current_words.extend(_split_words(line_text))

    if current_words:
        chapters.append(ParsedChapter(title=current_title, index=idx, words=current_words))

    return chapters
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd backend && pytest tests/test_pdf_parser.py -v
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/pdf_parser.py backend/tests/test_pdf_parser.py
git commit -m "feat: add PDF parser service using pymupdf"
```

---

### Task 6: Books router

**Files:**
- Create: `backend/app/routers/books.py`
- Create: `backend/tests/test_books.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_books.py
import io
import fitz


def make_pdf_bytes(title="Book", author="Auth", text="hello world foo bar") -> bytes:
    doc = fitz.open()
    doc.set_metadata({"title": title, "author": author})
    page = doc.new_page()
    page.insert_text((50, 72), text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_upload_book(client):
    pdf = make_pdf_bytes()
    response = client.post("/books/", files={"file": ("test.pdf", pdf, "application/pdf")})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Book"
    assert data["author"] == "Auth"
    assert data["total_words"] > 0
    assert len(data["chapters"]) >= 1
    assert len(data["chapters"][0]["words"]) > 0


def test_upload_non_pdf_rejected(client):
    response = client.post("/books/", files={"file": ("test.txt", b"hello", "text/plain")})
    assert response.status_code == 400


def test_list_books_empty(client):
    response = client.get("/books/")
    assert response.status_code == 200
    assert response.json() == []


def test_list_books_after_upload(client):
    pdf = make_pdf_bytes()
    client.post("/books/", files={"file": ("test.pdf", pdf, "application/pdf")})
    response = client.get("/books/")
    assert len(response.json()) == 1


def test_get_book_by_id(client):
    pdf = make_pdf_bytes()
    book_id = client.post("/books/", files={"file": ("test.pdf", pdf, "application/pdf")}).json()["id"]
    response = client.get(f"/books/{book_id}")
    assert response.status_code == 200
    assert response.json()["id"] == book_id


def test_get_missing_book_returns_404(client):
    assert client.get("/books/nonexistent").status_code == 404


def test_delete_book(client):
    pdf = make_pdf_bytes()
    book_id = client.post("/books/", files={"file": ("test.pdf", pdf, "application/pdf")}).json()["id"]
    assert client.delete(f"/books/{book_id}").status_code == 200
    assert client.get(f"/books/{book_id}").status_code == 404
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd backend && pytest tests/test_books.py -v
```

Expected: `404 Not Found` for all routes (router not registered yet).

- [ ] **Step 3: Write app/routers/books.py**

```python
# backend/app/routers/books.py
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.book import Book, Chapter
from app.schemas.book import BookSchema
from app.services.pdf_parser import parse_pdf
from app.services.storage import delete_pdf, save_pdf

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", response_model=BookSchema)
def upload_book(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    book_id = str(uuid.uuid4())
    file_bytes = file.file.read()
    storage_path = save_pdf(book_id, file_bytes)

    parsed = parse_pdf(storage_path)
    display_title = parsed.title if parsed.title != "Untitled" else file.filename.replace(".pdf", "")

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
```

- [ ] **Step 4: Register router in app/main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine
from app.routers import books

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Velocity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd backend && pytest tests/test_books.py -v
```

Expected: `7 passed`

- [ ] **Step 6: Commit**

```bash
git add backend/app/routers/books.py backend/app/main.py backend/tests/test_books.py
git commit -m "feat: add books router with upload, list, get, delete"
```

---

### Task 7: Progress router

**Files:**
- Create: `backend/app/routers/progress.py`
- Create: `backend/tests/test_progress.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_progress.py
import io
import fitz


def upload_book(client) -> str:
    doc = fitz.open()
    doc.set_metadata({"title": "T", "author": "A"})
    page = doc.new_page()
    page.insert_text((50, 72), "word1 word2 word3")
    buf = io.BytesIO()
    doc.save(buf)
    r = client.post("/books/", files={"file": ("t.pdf", buf.getvalue(), "application/pdf")})
    return r.json()["id"]


def test_get_progress_not_found(client):
    assert client.get("/books/nonexistent/progress").status_code == 404


def test_put_progress_creates(client):
    book_id = upload_book(client)
    r = client.put(f"/books/{book_id}/progress", json={"word_index": 10, "wpm": 300})
    assert r.status_code == 200
    data = r.json()
    assert data["word_index"] == 10
    assert data["wpm"] == 300
    assert data["book_id"] == book_id


def test_put_progress_updates(client):
    book_id = upload_book(client)
    client.put(f"/books/{book_id}/progress", json={"word_index": 10, "wpm": 300})
    r = client.put(f"/books/{book_id}/progress", json={"word_index": 50, "wpm": 400})
    assert r.json()["word_index"] == 50
    assert r.json()["wpm"] == 400


def test_get_progress_after_put(client):
    book_id = upload_book(client)
    client.put(f"/books/{book_id}/progress", json={"word_index": 25, "wpm": 250})
    r = client.get(f"/books/{book_id}/progress")
    assert r.status_code == 200
    assert r.json()["word_index"] == 25
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd backend && pytest tests/test_progress.py -v
```

Expected: `404 Not Found` for all routes.

- [ ] **Step 3: Write app/routers/progress.py**

```python
# backend/app/routers/progress.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.progress import ReadingProgress
from app.schemas.progress import ProgressSchema, ProgressUpdate

router = APIRouter(prefix="/books", tags=["progress"])


@router.get("/{book_id}/progress", response_model=ProgressSchema)
def get_progress(book_id: str, db: Session = Depends(get_db)):
    progress = db.query(ReadingProgress).filter_by(book_id=book_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found")
    return progress


@router.put("/{book_id}/progress", response_model=ProgressSchema)
def update_progress(book_id: str, body: ProgressUpdate, db: Session = Depends(get_db)):
    progress = db.query(ReadingProgress).filter_by(book_id=book_id).first()
    if progress:
        progress.word_index = body.word_index
        progress.wpm = body.wpm
        progress.last_read_at = datetime.utcnow()
    else:
        progress = ReadingProgress(
            book_id=book_id,
            word_index=body.word_index,
            wpm=body.wpm,
            last_read_at=datetime.utcnow(),
        )
        db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress
```

- [ ] **Step 4: Register progress router in app/main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine
from app.routers import books, progress

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Velocity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(progress.router)
```

- [ ] **Step 5: Run all tests — expect pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass (models + storage + parser + books + progress).

- [ ] **Step 6: Commit**

```bash
git add backend/app/routers/progress.py backend/app/main.py backend/tests/test_progress.py
git commit -m "feat: add progress router with get and upsert endpoints"
```

---

### Task 8: Smoke test running server

**Files:**
- No new files — verify full stack runs

- [ ] **Step 1: Start dev server**

```bash
cd backend && python run.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

- [ ] **Step 2: Verify API docs load**

Open `http://localhost:8000/docs` in browser. Confirm Swagger UI shows:
- `POST /books/`
- `GET /books/`
- `GET /books/{book_id}`
- `DELETE /books/{book_id}`
- `GET /books/{book_id}/progress`
- `PUT /books/{book_id}/progress`

- [ ] **Step 3: Upload a real PDF via Swagger**

Use the `POST /books/` endpoint in Swagger UI to upload any PDF. Confirm response includes `id`, `title`, `chapters`, and words in each chapter.

- [ ] **Step 4: Run full test suite one final time**

```bash
cd backend && pytest -v --tb=short
```

Expected: all tests pass, zero failures.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: backend complete — books + progress API with PDF parsing"
```
