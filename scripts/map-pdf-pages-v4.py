#!/usr/bin/env python3
"""Map every v2 bilingual reading block to the PDF page where its English text begins."""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "source.pdf"
BOOK_PATH = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else ROOT / "app" / "book-data-v2.json"
OUTPUT_PATH = Path(sys.argv[3]).resolve() if len(sys.argv) > 3 else ROOT / "app" / "pdf-page-map-v4.json"
MAP_VERSION = sys.argv[4] if len(sys.argv) > 4 else "v4"


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).lower()
    return "".join(char for char in text if char.isalnum())


def best_fuzzy_page(prefix: str, pages: list[str], start: int) -> tuple[int, float]:
    best_page = start
    best_score = 0.0
    for page_index in range(max(0, start - 1), min(len(pages), start + 12)):
        match = SequenceMatcher(None, prefix, pages[page_index], autojunk=False).find_longest_match()
        score = match.size / max(1, len(prefix))
        if score > best_score:
            best_page = page_index
            best_score = score
    return best_page, best_score


def locate_page(text: str, pages: list[str], start: int) -> tuple[int, str, float]:
    query = normalize(re.sub(r"^>\s*", "", text))
    prefix = query[: min(110, len(query))]
    search_start = max(0, start - 1)
    search_end = min(len(pages), start + 18)

    for length in (len(prefix), min(80, len(prefix)), min(50, len(prefix)), min(30, len(prefix))):
        if length < 18:
            continue
        needle = prefix[:length]
        for page_index in range(search_start, search_end):
            position = pages[page_index].find(needle)
            if position >= 0:
                return max(start, page_index), "exact", 1.0

    # Short standalone items (for example list entries) need their full text
    # searched from the current reading position. Looking one page backward can
    # incorrectly select an earlier mention of the same phrase.
    if 8 <= len(query) < 18:
        for page_index in range(start, search_end):
            if pages[page_index].find(query) >= 0:
                return page_index, "exact-short", 1.0

    # Catch text beginning near the end of one PDF page and continuing on the next.
    needle = prefix[: min(80, len(prefix))]
    if len(needle) >= 18:
        for page_index in range(search_start, min(len(pages) - 1, search_end)):
            joined = pages[page_index] + pages[page_index + 1]
            position = joined.find(needle)
            if position >= 0:
                actual_page = page_index if position < len(pages[page_index]) else page_index + 1
                return max(start, actual_page), "cross-page", 0.98

    fuzzy_page, score = best_fuzzy_page(prefix, pages, start)
    if score >= 0.72:
        return max(start, fuzzy_page), "fuzzy", score
    return start, "inherited", score


def main() -> None:
    if not PDF_PATH.exists():
        raise SystemExit(f"PDF not found: {PDF_PATH}")

    book = json.loads(BOOK_PATH.read_text(encoding="utf-8"))
    reader = PdfReader(str(PDF_PATH))
    pdf_pages = [normalize(page.extract_text() or "") for page in reader.pages]

    page_map: dict[str, int] = {}
    confidence: dict[str, dict[str, float | str]] = {}
    last_page = 0
    counts: dict[str, int] = {}

    for section in book["sections"]:
        for pair_index, pair in enumerate(section["pairs"]):
            source_pair = pair.get("sourcePairIndex")
            chunk_index = pair.get("chunkIndex", 0)
            stable_id = (
                f"{section['id']}-p-{pair_index}"
                if source_pair is None
                else f"{section['id']}-p-{source_pair}-{chunk_index}"
            )
            page_index, method, score = locate_page(pair["en"], pdf_pages, last_page)
            last_page = page_index
            page_map[stable_id] = page_index + 1
            confidence[stable_id] = {"method": method, "score": round(score, 3)}
            counts[method] = counts.get(method, 0) + 1

    payload = {
        "version": MAP_VERSION,
        "source": PDF_PATH.name,
        "pdfTotalPages": len(pdf_pages),
        "pageByPairId": page_map,
        "mappingSummary": counts,
        "confidenceByPairId": confidence,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"pdfPages": len(pdf_pages), "mappedPairs": len(page_map), "methods": counts}, indent=2))


if __name__ == "__main__":
    main()
