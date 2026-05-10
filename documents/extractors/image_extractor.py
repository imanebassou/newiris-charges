from .text_cleaner import clean_text


def extract_from_image(file) -> dict:
    text = ""
    method = "tesseract"

    try:
        from PIL import Image
        import pytesseract

        file.seek(0)
        image = Image.open(file)

        # Améliorer qualité image
        image = preprocess_image(image)

        # OCR avec plusieurs langues
        configs = [
            ('fra+eng', '--oem 3 --psm 6'),
            ('fra', '--oem 3 --psm 3'),
            ('eng', '--oem 3 --psm 6'),
        ]

        best_text = ""
        for lang, config in configs:
            try:
                t = pytesseract.image_to_string(image, lang=lang, config=config)
                if len(t) > len(best_text):
                    best_text = t
            except Exception:
                continue

        text = clean_text(best_text)

    except Exception as e:
        text = f"Erreur OCR image: {str(e)}"

    return {
        "text": text,
        "method": method,
        "success": len(text) > 10
    }


def preprocess_image(image):
    try:
        from PIL import ImageFilter, ImageEnhance
        # Convertir en niveaux de gris
        if image.mode != 'L':
            image = image.convert('L')
        # Améliorer contraste
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        # Améliorer netteté
        image = image.filter(ImageFilter.SHARPEN)
        return image
    except Exception:
        return image