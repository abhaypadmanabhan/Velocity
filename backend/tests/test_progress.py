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
