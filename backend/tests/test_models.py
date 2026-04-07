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
