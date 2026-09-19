"""Exercise page boundaries with a real, in-memory curriculum PDF."""
import io
import json
from pathlib import Path
import subprocess
import sys
import unittest

from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject


class SelectedPagesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        writer = PdfWriter()
        font = writer._add_object(DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')}))
        for number in range(1, 120):
            page = writer.add_blank_page(width=595, height=842)
            page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): font})})
            content = DecodedStreamObject()
            content.set_data(f'BT /F1 12 Tf 10 800 Td (Curriculum page {number}: independent thesis and research.) Tj ET'.encode())
            page[NameObject('/Contents')] = writer._add_object(content)
        buffer = io.BytesIO()
        writer.write(buffer)
        cls.document = buffer.getvalue()

    def extract(self, selection=None):
        args = [sys.executable, str(Path(__file__).with_name('pdf-text.py'))]
        if selection is not None:
            args.append(json.dumps(selection))
        return subprocess.run(args, input=self.document, capture_output=True, timeout=15)

    def test_long_document_requires_explicit_bounded_pages(self):
        self.assertNotEqual(self.extract().returncode, 0)
        response = self.extract([1, 57, 119])
        self.assertEqual(response.returncode, 0, response.stderr.decode())
        result = json.loads(response.stdout)
        self.assertEqual(result['pageNumbers'], [1, 57, 119])
        self.assertEqual(result['totalPages'], 119)
        self.assertEqual(len(result['pages']), 3)
        self.assertIn('page 57:', result['pages'][1])
        self.assertNotIn('page 58:', ''.join(result['pages']))

    def test_invalid_ranges_cannot_select_implicit_or_extra_pages(self):
        for selection in ([], [0], [120], [1, 1], [True], [1.5], list(range(1, 52))):
            with self.subTest(selection=selection):
                self.assertNotEqual(self.extract(selection).returncode, 0)


if __name__ == '__main__':
    unittest.main()
