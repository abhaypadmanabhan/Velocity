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
