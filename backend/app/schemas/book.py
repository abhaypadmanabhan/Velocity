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
    # storage_path intentionally excluded — filesystem path is internal

    model_config = {"from_attributes": True}
