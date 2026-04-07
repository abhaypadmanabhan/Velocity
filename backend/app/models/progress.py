from datetime import datetime, UTC
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db import Base


class ReadingProgress(Base):
    __tablename__ = "progress"

    book_id = Column(String, ForeignKey("books.id"), primary_key=True)
    word_index = Column(Integer, default=0)
    wpm = Column(Integer, default=250)
    last_read_at = Column(DateTime, default=lambda: datetime.now(UTC))

    book = relationship("Book", back_populates="progress")
