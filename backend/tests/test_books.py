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
