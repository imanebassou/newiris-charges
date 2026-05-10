import io
from .text_cleaner import clean_text


def extract_from_pdf(file) -> dict:
    text = ""
    pages = 0
    method = "pypdf2"

    try:
        import PyPDF2
        file.seek(0)
        reader = PyPDF2.PdfReader(file)
        pages = len(reader.pages)

        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"

        text = clean_text(text)

        # Si texte vide → PDF scanné → essayer OCR
        if len(text.strip()) < 50:
            method = "ocr_fallback"
            text = extract_pdf_with_ocr(file)

    except Exception as e:
        text = f"Erreur PDF: {str(e)}"

    return {
        "text": text,
        "pages": pages,
        "method": method,
        "success": len(text) > 10
    }


def extract_pdf_with_ocr(file) -> str:
    try:
        from pdf2image import convert_from_bytes
        from PIL import Image
        import pytesseract

        file.seek(0)
        images = convert_from_bytes(file.read(), dpi=200)
        text = ""
        for img in images[:5]:
            page_text = pytesseract.image_to_string(img, lang='fra+eng')
            text += page_text + "\n"
        return clean_text(text)
    except Exception as e:
        return f"Erreur OCR PDF: {str(e)}"