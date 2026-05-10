EXTRACTION_PROMPT = """Tu es un expert NEWIRIS en analyse de documents d'entreprise marocaine.
Analyse ce document et extrais les informations avec précision.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après, sans backticks.

Nom du fichier: {filename}
Type détecté: {file_type}
Montants trouvés: {amounts}
Dates trouvées: {dates}

Contenu du document:
{text}

Format JSON requis:
{{
  "type_document": "facture|bon_de_commande|contrat_rh|contrat_fournisseur|recu|devis|autre",
  "module_suggere": "commandes|fournisseurs|charges_fixes|charges_variables|cheques|salaires|caisse|banque|autre",
  "confiance": "haute|moyenne|faible",
  "champs": {{
    "titre": "",
    "fournisseur": "",
    "montant": "",
    "date": "",
    "echeance": "",
    "reference": "",
    "nom": "",
    "prenom": "",
    "salaire_base": "",
    "type_contrat": "",
    "categorie": "",
    "description": "",
    "numero_facture": "",
    "tva": "",
    "mode_paiement": ""
  }},
  "resume": "résumé en 1-2 phrases",
  "actions_suggerees": ["action1", "action2"]
}}"""


VALIDATION_PROMPT = """Vérifie et corrige ces données extraites d'un document NEWIRIS.
Type document: {type_document}
Données brutes: {champs}

Corrige les erreurs évidentes (montants mal formatés, dates incorrectes).
Réponds UNIQUEMENT avec le JSON corrigé des champs, sans texte avant ou après."""