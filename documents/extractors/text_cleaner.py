import re


def clean_text(text: str) -> str:
    if not text:
        return ""
    # Supprimer caractères spéciaux inutiles
    text = re.sub(r'\x00', '', text)
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\r', '\n', text)
    # Supprimer lignes vides multiples
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Supprimer espaces multiples
    text = re.sub(r' {2,}', ' ', text)
    # Nettoyer début/fin
    text = text.strip()
    return text


def extract_amounts(text: str) -> list:
    patterns = [
        r'\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?\s*(?:DH|MAD|€|EUR|\$)',
        r'(?:DH|MAD|€|EUR|\$)\s*\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?',
        r'\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?',
    ]
    amounts = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        amounts.extend(matches)
    return list(set(amounts))[:5]


def extract_dates(text: str) -> list:
    patterns = [
        r'\d{2}[/-]\d{2}[/-]\d{4}',
        r'\d{4}[/-]\d{2}[/-]\d{2}',
        r'\d{2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}',
    ]
    dates = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        dates.extend(matches)
    return list(set(dates))[:5]


def truncate_for_ai(text: str, max_chars: int = 2500) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[... texte tronqué ...]"