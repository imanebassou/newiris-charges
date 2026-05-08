import os
import json
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.core.files.uploadedfile import InMemoryUploadedFile

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "mistral"


def extract_text_from_file(file):
    filename = file.name.lower()
    text = ""

    try:
        # PDF
        if filename.endswith('.pdf'):
            import PyPDF2
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""

        # Word
        elif filename.endswith('.docx'):
            import docx
            doc = docx.Document(file)
            for para in doc.paragraphs:
                text += para.text + "\n"

        # Excel
        elif filename.endswith(('.xlsx', '.xls')):
            import openpyxl
            wb = openpyxl.load_workbook(file)
            for sheet in wb.sheetnames:
                ws = wb[sheet]
                for row in ws.iter_rows(values_only=True):
                    text += ' | '.join([str(c) for c in row if c is not None]) + "\n"

        # Images (OCR)
        elif filename.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff')):
            from PIL import Image
            import pytesseract
            image = Image.open(file)
            text = pytesseract.image_to_string(image, lang='fra+eng')

        # Texte brut
        elif filename.endswith('.txt'):
            text = file.read().decode('utf-8')

    except Exception as e:
        text = f"Erreur extraction: {str(e)}"

    return text.strip()


def analyze_with_ai(text, filename):
    prompt = f"""Tu es un assistant NEWIRIS specialise dans l'analyse de documents.
Analyse ce document et extrait les informations importantes.
Reponds UNIQUEMENT avec un JSON valide, sans texte avant ou apres.

Document: {filename}
Contenu: {text[:2000]}

Reponds avec ce format JSON exact:
{{
  "type_document": "facture|bon_de_commande|contrat_rh|contrat_fournisseur|autre",
  "module_suggere": "commandes|fournisseurs|charges_fixes|cheques|salaires|autre",
  "champs": {{
    "titre": "",
    "fournisseur": "",
    "montant": "",
    "date": "",
    "echeance": "",
    "nom": "",
    "prenom": "",
    "salaire_base": "",
    "type_contrat": "",
    "categorie": "",
    "description": ""
  }},
  "confiance": "haute|moyenne|faible",
  "resume": ""
}}"""

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 500,
                "temperature": 0.1,
            }
        }, timeout=120)

        reponse_text = response.json().get('response', '')

        # Nettoyer et parser JSON
        reponse_text = reponse_text.strip()
        if '```json' in reponse_text:
            reponse_text = reponse_text.split('```json')[1].split('```')[0]
        elif '```' in reponse_text:
            reponse_text = reponse_text.split('```')[1].split('```')[0]

        start = reponse_text.find('{')
        end = reponse_text.rfind('}') + 1
        if start != -1 and end > start:
            reponse_text = reponse_text[start:end]

        return json.loads(reponse_text)

    except Exception as e:
        return {
            "type_document": "autre",
            "module_suggere": "autre",
            "champs": {},
            "confiance": "faible",
            "resume": f"Erreur analyse IA: {str(e)}"
        }


class DocumentExtractView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Aucun fichier fourni'}, status=400)

        # Vérifier taille (max 10MB)
        if file.size > 10 * 1024 * 1024:
            return Response({'error': 'Fichier trop grand (max 10MB)'}, status=400)

        # Extraire texte
        text = extract_text_from_file(file)
        if not text:
            return Response({'error': 'Impossible d\'extraire le texte du document'}, status=400)

        # Analyser avec IA
        analysis = analyze_with_ai(text, file.name)

        return Response({
            'filename': file.name,
            'text_extrait': text[:500],
            'analyse': analysis
        })