from app.services.storage import save_pdf, get_pdf_path, delete_pdf


def test_save_and_retrieve_pdf(tmp_path):
    from app.db import settings
    settings.storage_dir = str(tmp_path)

    data = b"%PDF-1.4 fake content"
    path = save_pdf("book-123", data)

    assert get_pdf_path("book-123").exists()
    assert get_pdf_path("book-123").read_bytes() == data


def test_delete_pdf(tmp_path):
    from app.db import settings
    settings.storage_dir = str(tmp_path)

    save_pdf("book-456", b"data")
    assert get_pdf_path("book-456").exists()

    delete_pdf("book-456")
    assert not get_pdf_path("book-456").exists()


def test_delete_nonexistent_pdf_is_noop(tmp_path):
    from app.db import settings
    settings.storage_dir = str(tmp_path)

    delete_pdf("does-not-exist")  # should not raise
