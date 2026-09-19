"""Read one bounded PDF from stdin. No downloads, OCR, or document mutations."""
import io
import json
import sys

from pypdf import PdfReader

data = sys.stdin.buffer.read(10_000_001)
if len(data) > 10_000_000 or not data.startswith(b"%PDF-"):
    raise ValueError("invalid_pdf_input")
reader = PdfReader(io.BytesIO(data))
if reader.is_encrypted or not 1 <= len(reader.pages) <= 500:
    raise ValueError("unsupported_pdf")
selection = json.loads(sys.argv[1]) if len(sys.argv) == 2 else list(range(1, len(reader.pages) + 1))
if (not isinstance(selection, list) or not 1 <= len(selection) <= 50
        or any(type(n) is not int or n < 1 or n > len(reader.pages) for n in selection)
        or len(set(selection)) != len(selection)):
    raise ValueError("invalid_pdf_page_selection")
pages = [reader.pages[n - 1].extract_text() or "" for n in selection]
if sum(map(len, pages)) > 1_000_000:
    raise ValueError("pdf_text_too_large")
print(json.dumps({"pages": pages, "pageNumbers": selection, "totalPages": len(reader.pages)}, ensure_ascii=False))
