import re
from dataclasses import dataclass, field
import fitz


@dataclass
class ParsedChapter:
    title: str
    index: int
    words: list[str] = field(default_factory=list)


@dataclass
class ParsedBook:
    title: str
    author: str
    chapters: list[ParsedChapter] = field(default_factory=list)
    all_words: list[str] = field(default_factory=list)


def _fix_hyphenation(text: str) -> str:
    return re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)


def _split_words(text: str) -> list[str]:
    return [w for w in text.split() if w.strip() and w.strip() not in {"-", "–", "—"}]


def parse_pdf(path: str) -> ParsedBook:
    doc = fitz.open(path)
    title = doc.metadata.get("title") or "Untitled"
    author = doc.metadata.get("author") or ""

    toc = doc.get_toc()  # [[level, title, page_number], ...]
    chapters = _parse_with_toc(doc, toc) if toc else _parse_with_heuristics(doc)

    if not chapters:
        full_text = _fix_hyphenation("".join(p.get_text() for p in doc))
        chapters = [ParsedChapter(title="Full Document", index=0, words=_split_words(full_text))]

    all_words: list[str] = []
    for ch in chapters:
        all_words.extend(ch.words)

    doc.close()
    return ParsedBook(title=title, author=author, chapters=chapters, all_words=all_words)


def _parse_with_toc(doc: fitz.Document, toc: list) -> list[ParsedChapter]:
    entries = [(t, p) for lvl, t, p in toc if lvl == 1] or [(t, p) for _, t, p in toc]
    chapters: list[ParsedChapter] = []

    for i, (ch_title, start_page) in enumerate(entries):
        end_page = entries[i + 1][1] - 1 if i + 1 < len(entries) else len(doc)
        pages = range(max(0, start_page - 1), min(end_page, len(doc)))
        text = _fix_hyphenation("".join(doc[p].get_text() for p in pages))
        words = _split_words(text)
        if words:
            chapters.append(ParsedChapter(title=ch_title, index=i, words=words))

    return chapters


def _parse_with_heuristics(doc: fitz.Document) -> list[ParsedChapter]:
    heading_re = re.compile(r"^(chapter|part|section)\s+\w+", re.IGNORECASE)
    chapters: list[ParsedChapter] = []
    current_title = "Introduction"
    current_words: list[str] = []
    idx = 0

    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                line_text = " ".join(s["text"] for s in line["spans"]).strip()
                if not line_text:
                    continue
                max_size = max((s["size"] for s in line["spans"]), default=0)
                is_heading = len(line_text) < 80 and max_size >= 14 and heading_re.match(line_text)
                if is_heading and current_words:
                    chapters.append(ParsedChapter(title=current_title, index=idx, words=current_words))
                    idx += 1
                    current_title = line_text
                    current_words = []
                else:
                    current_words.extend(_split_words(line_text))

    if current_words:
        chapters.append(ParsedChapter(title=current_title, index=idx, words=current_words))

    return chapters
