import json
import requests
from .memory import ConversationMemory
from agents.metier_agent import MetierAgent
from agents.sql_agent import SQLAgent

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "phi3:mini"

REPONSES_RAPIDES = {
    ('bonjour', 'salut', 'bonsoir', 'hello', 'salam'):
        "Bonjour ! Je suis NEWIRIS AI. Je peux vous aider sur les finances, commandes, fournisseurs, chantiers et plus. Que souhaitez-vous savoir ?",
    ('merci', 'thank', 'shukran'):
        "De rien ! N'hésitez pas si vous avez d'autres questions.",
    ('aide', 'help', 'que peux tu faire'):
        "Je peux vous aider sur : caisse, banque, charges, commandes, fournisseurs, chèques, salaires, chantiers.",
    ('au revoir', 'bye', 'bonne journee'):
        "Au revoir ! Bonne journée.",
}

MODULES_KEYWORDS = {
    'banque': ['banque', 'virement', 'solde banque'],
    'caisse': ['caisse', 'espece', 'liquide'],
    'charges_fixes': ['charge fixe', 'charges fixes', 'loyer'],
    'charges_variables': ['charge variable', 'depense variable'],
    'commandes': ['commande', 'achat', 'bon de commande'],
    'fournisseurs': ['fournisseur', 'contrat', 'regularite'],
    'cheques': ['cheque', 'signature'],
    'salaires': ['salaire', 'salarie', 'paie'],
    'chantiers': ['chantier', 'projet', 'travaux'],
    'previsions': ['prevision', 'budget'],
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
        q = question.lower()
        modules = []
        for module, keywords in MODULES_KEYWORDS.items():
            if any(k in q for k in keywords):
                modules.append(module)
        return modules if modules else ['general']

    def process(self, question):
        question_lower = question.lower().strip()

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