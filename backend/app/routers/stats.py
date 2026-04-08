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

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # Calculate real baseline stats
    wpm_avg = db.query(func.avg(ReadingProgress.wpm)).scalar() or 250
    avg_wpm = int(round(wpm_avg))
    words_read = db.query(func.sum(ReadingProgress.word_index)).scalar() or 0
    words_read = int(words_read)

    endurance_mins = 0
    if avg_wpm > 0:
        # Just simulate endurance from words read assuming average reading
        endurance_mins = max(15, min((words_read / avg_wpm), 105)) # up to 1h 45m

    # Simulate WPM Progression leading up to avg_wpm (mock logic based on real wpm)
    progression = [
        {"date": "OCT 04", "wpm": max(100, avg_wpm - 180)},
        {"date": "OCT 12", "wpm": max(120, avg_wpm - 100)},
        {"date": "OCT 21", "wpm": max(150, avg_wpm - 40)},
        {"date": "CURRENT", "wpm": avg_wpm},
    ]

    # Map layout to simulated retention data
    days = ["MON", "TUE", "WED"]
    heatmap = []
    
    # We will just generate it based on avg_wpm
    retention_base = min(92, max(60, 100 - (avg_wpm - 250) * 0.05))

    for day in days:
        for week in range(1, 10): # 9 cells per row to match UI layout loosely
            heatmap.append({
                "day_str": day,
                "week": week,
                "wpm": int(avg_wpm * (0.8 + 0.4 * (week % 3))),
                "retention": int(retention_base * (0.8 + 0.2 * (week % 2)))
            })

    return {
        "progression": progression,
        "endurance_mins": int(endurance_mins),
        "endurance_sustained_wpm": max(200, avg_wpm - 50),
        "endurance_vs_prev": 12, # mock +12 min
        "heatmap": heatmap
    }
