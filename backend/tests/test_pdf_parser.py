import fitz
import pytest
from app.services.pdf_parser import parse_pdf, ParsedBook


def make_pdf(tmp_path, pages: list[str], title="Test", author="Auth") -> str:
    path = str(tmp_path / "test.pdf")
    doc = fitz.open()
    doc.set_metadata({"title": title, "author": author})
    for text in pages:
        page = doc.new_page()
        page.insert_text((50, 72), text, fontsize=12)
    doc.save(path)
    doc.close()
    return path


def test_parse_returns_parsed_book(tmp_path):
    path = make_pdf(tmp_path, ["Hello world this is the first page"])
    result = parse_pdf(path)

    assert isinstance(result, ParsedBook)
    assert result.title == "Test"
    assert result.author == "Auth"
    assert len(result.chapters) >= 1
    assert len(result.all_words) > 0


def test_all_words_flattens_chapters(tmp_path):
    path = make_pdf(tmp_path, ["one two three", "four five six"])
    result = parse_pdf(path)

    total = sum(len(ch.words) for ch in result.chapters)
    assert total == len(result.all_words)


def test_empty_words_filtered(tmp_path):
    path = make_pdf(tmp_path, ["  hello   world  "])
    result = parse_pdf(path)

    for ch in result.chapters:
        for word in ch.words:
            assert word.strip() != ""
