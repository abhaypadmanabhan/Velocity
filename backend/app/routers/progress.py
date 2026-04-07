from datetime import datetime, timezone
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
        progress.last_read_at = datetime.now(timezone.utc)
    else:
        progress = ReadingProgress(
            book_id=book_id,
            word_index=body.word_index,
            wpm=body.wpm,
            last_read_at=datetime.now(timezone.utc),
        )
        db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress
