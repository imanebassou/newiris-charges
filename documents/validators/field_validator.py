import re
from datetime import datetime


def validate_montant(value: str) -> dict:
    if not value:
        return {"valid": False, "value": "", "error": "Montant vide"}
    cleaned = re.sub(r'[^\d.,]', '', value.replace(' ', ''))
    cleaned = cleaned.replace(',', '.')
    try:
        amount = float(cleaned)
        return {"valid": True, "value": f"{amount:,.2f}", "error": None}
    except ValueError:
        return {"valid": False, "value": value, "error": "Format invalide"}


def validate_date(value: str) -> dict:
    if not value:
        return {"valid": False, "value": "", "error": "Date vide"}
    formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y']
    for fmt in formats:
        try:
            d = datetime.strptime(value.strip(), fmt)
            return {"valid": True, "value": d.strftime('%Y-%m-%d'), "error": None}
        except ValueError:
            continue
    return {"valid": False, "value": value, "error": "Format de date invalide"}


def validate_fields(champs: dict) -> dict:
    validated = {}
    validators = {
        'montant': validate_montant,
        'salaire_base': validate_montant,
        'tva': validate_montant,
        'date': validate_date,
        'echeance': validate_date,
    }
    for key, value in champs.items():
        if key in validators and value:
            result = validators[key](str(value))
            validated[key] = {
                "value": result["value"] or value,
                "valid": result["valid"],
                "error": result["error"],
                "original": value
            }
        else:
            validated[key] = {
                "value": value or "",
                "valid": True,
                "error": None,
                "original": value
            }
    return validated