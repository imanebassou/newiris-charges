import json
import requests
from .memory import ConversationMemory
from agents.metier_agent import MetierAgent
from agents.sql_agent import SQLAgent

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "phi3:mini"

REPONSES_RAPIDES = {
    ('bonjour', 'salut', 'bonsoir', 'hello', 'salam', 'hi'):
        "Bonjour ! Je suis NEWIRIS AI. Je peux vous aider sur les finances, commandes, fournisseurs, chantiers, véhicules et plus. Que souhaitez-vous savoir ?",
    ('merci', 'thank', 'shukran', 'شكرا'):
        "De rien ! N'hésitez pas si vous avez d'autres questions.",
    ('aide', 'help', 'que peux tu faire', 'quelles sont tes capacités'):
        "Je peux vous aider sur : caisse, banque, charges fixes/variables, commandes, fournisseurs, chèques, salaires, chantiers, prévisions, véhicules. Posez votre question !",
    ('au revoir', 'bye', 'bonne journee', 'bonne journée', 'a bientot'):
        "Au revoir ! Bonne journée.",
}

# Enriched keywords — more terms per module, handles accents loosely
MODULES_KEYWORDS = {
    'banque': [
        'banque', 'virement', 'solde banque', 'compte bancaire',
        'opération bancaire', 'chèque banque', 'relevé',
    ],
    'caisse': [
        'caisse', 'espece', 'espèce', 'liquide', 'cash',
        'solde caisse', 'caisse principale', 'caisse personnelle',
    ],
    'charges_fixes': [
        'charge fixe', 'charges fixes', 'loyer', 'abonnement',
        'charge récurrente', 'charges recurrentes', 'fixe mensuel',
    ],
    'charges_variables': [
        'charge variable', 'charges variables', 'depense variable',
        'dépense variable', 'achat ponctuel', 'frais variable',
        'depense', 'dépense',
    ],
    'commandes': [
        'commande', 'achat', 'bon de commande', 'bc', 'po',
        'validation commande', 'demande achat', 'commandes en attente',
    ],
    'fournisseurs': [
        'fournisseur', 'contrat', 'regularite', 'régularité',
        'contrat fournisseur', 'echeance fournisseur', 'échéance',
        'regularite fournisseur', 'fournisseurs depasses',
    ],
    'cheques': [
        'cheque', 'chèque', 'signature', 'demande cheque',
        'cheque en attente', 'chèques à signer',
    ],
    'salaires': [
        'salaire', 'salarie', 'salarié', 'paie', 'masse salariale',
        'rh', 'ressources humaines', 'contrat employe', 'employé',
    ],
    'chantiers': [
        'chantier', 'projet', 'travaux', 'site', 'chantier bloque',
        'chantier en cours', 'planification', 'chantiers',
    ],
    'previsions': [
        'prevision', 'prévision', 'budget', 'semaine', 'previsionnel',
        'prévisionnel', 'planification financiere', 'trésorerie prévisionnelle',
    ],
    'vehicules': [
        'vehicule', 'véhicule', 'voiture', 'camion', 'flotte',
        'assurance vehicule', 'vignette', 'vidange', 'matricule',
        'en panne', 'parc auto',
    ],
}


class AIOrchestrator:

    def __init__(self, user):
        self.user = user
        self.memory = ConversationMemory(user)
        self.metier_agent = MetierAgent()
        self.sql_agent = SQLAgent()

    def get_reponse_rapide(self, question_lower):
        for mots_cles, reponse in REPONSES_RAPIDES.items():
            if any(w in question_lower for w in mots_cles):
                return reponse
        return None

    def detect_modules(self, question):
        """
        Keyword-based module detection.
        Returns list of matched modules, or ['general'] if none match.
        Multiple modules can match (e.g. "compare caisse et banque").
        """
        q = question.lower()
        # Normalize accents for matching
        import unicodedata
        q_norm = ''.join(
            c for c in unicodedata.normalize('NFD', q)
            if unicodedata.category(c) != 'Mn'
        )

        modules = []
        for module, keywords in MODULES_KEYWORDS.items():
            for kw in keywords:
                kw_norm = ''.join(
                    c for c in unicodedata.normalize('NFD', kw)
                    if unicodedata.category(c) != 'Mn'
                )
                if kw_norm in q_norm:
                    modules.append(module)
                    break

        # Always add general for broad/summary questions
        summary_triggers = ['résumé', 'resume', 'tableau de bord', 'dashboard',
                            'situation', 'état', 'etat', 'bilan', 'rapport',
                            'quoi de neuf', "qu'est-ce qui", 'alerte', 'urgent']
        if any(t in q_norm for t in summary_triggers):
            if 'general' not in modules:
                modules.insert(0, 'general')

        return modules if modules else ['general']

    def process(self, question):
        question_lower = question.lower().strip()

        # Quick replies bypass LLM entirely
        reponse_rapide = self.get_reponse_rapide(question_lower)
        if reponse_rapide:
            self.memory.save(question, reponse_rapide, [])
            return {'reponse': reponse_rapide, 'modules': [], 'agent': 'quick'}

        modules = self.detect_modules(question)
        history = self.memory.get_context_string()

        reponse = self.metier_agent.run(
            question=question,
            modules=modules,
            username=self.user.username,
            history=history
        )

        self.memory.save(question, reponse, modules)

        return {
            'reponse': reponse,
            'modules': modules,
            'agent': 'metier'
        }