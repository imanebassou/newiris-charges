import json
import requests
from .prompts import EXTRACTION_PROMPT, VALIDATION_PROMPT
from documents.extractors.text_cleaner import extract_amounts, extract_dates, truncate_for_ai

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "mistral"


def detect_file_type(filename: str) -> str:
    name = filename.lower()
    if 'facture' in name or 'invoice' in name or 'fa' in name:
        return 'facture'
    elif 'commande' in name or 'bc' in name or 'bon' in name:
        return 'bon_de_commande'
    elif 'contrat' in name or 'contract' in name:
        return 'contrat'
    elif 'salaire' in name or 'paie' in name or 'rh' in name:
        return 'contrat_rh'
    elif 'fournisseur' in name:
        return 'contrat_fournisseur'
    return 'inconnu'


def call_ollama(prompt: str, max_tokens: int = 600) -> str:
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": 0.1,
                "num_ctx": 3000,
            }
        }, timeout=180)
        return response.json().get('response', '')
    except Exception as e:
        return f"Erreur Ollama: {str(e)}"


def parse_json_response(text: str) -> dict:
    try:
        text = text.strip()
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            text = text[start:end]
        return json.loads(text)
    except Exception:
        return {}


def analyze_document(text: str, filename: str) -> dict:
    file_type = detect_file_type(filename)
    amounts = extract_amounts(text)
    dates = extract_dates(text)
    truncated_text = truncate_for_ai(text, 2500)

    prompt = EXTRACTION_PROMPT.format(
        filename=filename,
        file_type=file_type,
        amounts=', '.join(amounts) if amounts else 'aucun détecté',
        dates=', '.join(dates) if dates else 'aucune détectée',
        text=truncated_text
    )

    response_text = call_ollama(prompt, max_tokens=700)
    result = parse_json_response(response_text)

    if not result:
        return {
            "type_document": file_type if file_type != 'inconnu' else 'autre',
            "module_suggere": "autre",
            "confiance": "faible",
            "champs": {},
            "resume": "Extraction automatique échouée. Remplissez manuellement.",
            "actions_suggerees": []
        }

    # Enrichir avec données pré-détectées si champs vides
    champs = result.get('champs', {})
    if not champs.get('montant') and amounts:
        champs['montant'] = amounts[0]
    if not champs.get('date') and dates:
        champs['date'] = dates[0]

    result['champs'] = champs
    return result