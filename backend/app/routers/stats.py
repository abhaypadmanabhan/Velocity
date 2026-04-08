from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import get_db
from app.models.book import Book, Chapter
from app.models.progress import ReadingProgress
from pydantic import BaseModel

router = APIRouter(prefix="/stats", tags=["stats"])

class StatsResponse(BaseModel):
    total_books: int
    total_words_read: int
    avg_wpm: int
    chapters_completed: int
    overall_progress_percent: int

@router.get("/", response_model=StatsResponse)
def get_global_stats(db: Session = Depends(get_db)):
    total_books = db.query(Book).count()
    
    # words read
    words_read = db.query(func.sum(ReadingProgress.word_index)).scalar() or 0
    words_read = int(words_read)
    
    # avg wpm
    wpm_avg = db.query(func.avg(ReadingProgress.wpm)).scalar() or 0
    avg_wpm = int(round(wpm_avg))
    
    # overall progress ratio
    total_words_in_assigned_books = 0
    all_books = db.query(Book).all()
    
    chapters_completed = 0
    for book in all_books:
        total_words_in_assigned_books += book.total_words
        
        # progress for this book
        prog = db.query(ReadingProgress).filter_by(book_id=book.id).first()
        if prog:
            # count chapters completed
            completed = db.query(Chapter).filter(
                Chapter.book_id == book.id,
                Chapter.word_end <= prog.word_index
            ).count()
            chapters_completed += completed
            
    progress_percent = 0
    if total_words_in_assigned_books > 0:
        progress_percent = int((words_read / total_words_in_assigned_books) * 100)
        
    return StatsResponse(
        total_books=total_books,
        total_words_read=words_read,
        avg_wpm=avg_wpm,
        chapters_completed=chapters_completed,
        overall_progress_percent=progress_percent
    )
