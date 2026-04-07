from datetime import datetime, UTC
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
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

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
