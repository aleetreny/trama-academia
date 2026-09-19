"""Read one bounded PDF from stdin. No downloads, OCR, or document mutations."""
import io
import json
import sys

from pypdf import PdfReader

data = sys.stdin.buffer.read(10_000_001)
if len(data) > 10_000_000 or not data.startswith(b"%PDF-"):
    raise ValueError("invalid_pdf_input")
reader = PdfReader(io.BytesIO(data))
if reader.is_encrypted or not 1 <= len(reader.pages) <= 50:
    raise ValueError("unsupported_pdf")
pages = [page.extract_text() or "" for page in reader.pages]
if sum(map(len, pages)) > 1_000_000:
    raise ValueError("pdf_text_too_large")
print(json.dumps({"pages": pages}, ensure_ascii=False))
