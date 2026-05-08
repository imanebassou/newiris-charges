from django.db import connection
from .base_agent import BaseAgent

TABLES_AUTORISEES = [
    'commandes_commande',
    'fournisseurs_fournisseur',
    'charges_fixes_chargefix',
    'charges_variables_chargevariable',
    'caisse_actioncaisse',
    'caisse_soldecaisse',
    'banque_actionbanque',
    'banque_soldeinitial',
    'cheques_demandecheque',
    'salaires_salarie',
    'chantiers_chantier',
]

MOTS_INTERDITS = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']


class SQLAgent(BaseAgent):

    def __init__(self):
        super().__init__(
            name="SQLAgent",
            description="Agent SQL sécurisé NEWIRIS"
        )

    def is_safe(self, query):
        query_upper = query.upper()
        for mot in MOTS_INTERDITS:
            if mot in query_upper:
                return False, f"Requête non autorisée: {mot}"
        return True, "OK"

    def generate_sql(self, question):
        prompt = f"""SQL PostgreSQL SELECT uniquement.
Tables: {', '.join(TABLES_AUTORISEES)}
Question: {question}
SQL:"""
        return self.call_ollama(prompt, temperature=0.1, max_tokens=150)

    def execute_safe(self, query):
        is_safe, reason = self.is_safe(query)
        if not is_safe:
            return None, reason
        if not query.upper().strip().startswith('SELECT'):
            return None, "SELECT uniquement"
        try:
            with connection.cursor() as cursor:
                cursor.execute(query)
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchmany(20)
                return {'columns': columns, 'rows': rows}, None
        except Exception as e:
            return None, str(e)

    def run(self, question, context=""):
        sql = self.generate_sql(question).strip().rstrip(';') + ';'
        result, error = self.execute_safe(sql)
        if error:
            return f"Erreur requête: {error}"
        if not result or not result['rows']:
            return "Aucun résultat."
        prompt = f"""Données: colonnes={result['columns']}, résultats={result['rows'][:5]}
Question: {question}
Explique en français:"""
        return self.call_ollama(prompt, temperature=0.3, max_tokens=200)