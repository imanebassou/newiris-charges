from django.db.models import Sum
from django.utils import timezone
from .base_agent import BaseAgent

from commandes.models import Commande
from fournisseurs.models import Fournisseur
from charges_fixes.models import ChargeFix
from caisse.models import ActionCaisse, SoldeCaisse
from banque.models import ActionBanque, SoldeInitial
from cheques.models import DemandeCheque
from salaires.models import Salarie
from chantiers.models import Chantier


class MetierAgent(BaseAgent):

    def __init__(self):
        super().__init__(
            name="MetierAgent",
            description="Agent métier NEWIRIS"
        )

    def get_data(self, modules):
        context = ""
        try:
            if 'commandes' in modules:
                commandes = Commande.objects.all()
                total = commandes.aggregate(t=Sum('montant'))['t'] or 0
                en_attente = commandes.filter(validation_direction='en_attente').count()
                context += f"COMMANDES: {commandes.count()} | {total:,.0f} DH | {en_attente} en attente\n"
                for c in commandes[:5]:
                    context += f"- {c.titre} | {c.montant} DH | {c.validation_direction}\n"

            if 'fournisseurs' in modules:
                fournisseurs = list(Fournisseur.objects.all())
                depasses = [f for f in fournisseurs if f.etat_regularite == 'depasee']
                context += f"FOURNISSEURS: {len(fournisseurs)} total | {len(depasses)} dépassés\n"
                for f in fournisseurs[:5]:
                    context += f"- {f.nom} | {f.etat_regularite} | {f.date_fin_rf}\n"

            if 'charges_fixes' in modules:
                charges = ChargeFix.objects.all()
                total = charges.aggregate(t=Sum('montant'))['t'] or 0
                context += f"CHARGES FIXES: {charges.count()} | Total: {total:,.0f} DH\n"
                for c in charges[:5]:
                    context += f"- {c.categorie} | {c.montant:,.0f} DH\n"

            if 'caisse' in modules:
                solde = SoldeCaisse.objects.first()
                entrees = ActionCaisse.objects.filter(type='entree', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
                sorties = ActionCaisse.objects.filter(type='sortie', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
                context += f"CAISSE: {solde.montant if solde else 0:,.0f} DH | E:{entrees:,.0f} | S:{sorties:,.0f}\n"

            if 'banque' in modules:
                solde = SoldeInitial.objects.first()
                entrees = ActionBanque.objects.filter(type='entree', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
                sorties = ActionBanque.objects.filter(type='sortie', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
                en_cours = ActionBanque.objects.filter(statut='en_cours').count()
                context += f"BANQUE: {solde.montant if solde else 0:,.0f} DH | E:{entrees:,.0f} | S:{sorties:,.0f} | {en_cours} en cours\n"

            if 'cheques' in modules:
                cheques = DemandeCheque.objects.all()
                total = cheques.aggregate(t=Sum('montant'))['t'] or 0
                en_attente = cheques.filter(statut_ticket='en_attente_signature').count()
                context += f"CHEQUES: {cheques.count()} | {total:,.0f} DH | {en_attente} en attente signature\n"

            if 'salaires' in modules:
                salaries = Salarie.objects.all()
                total = salaries.aggregate(t=Sum('salaire_base'))['t'] or 0
                context += f"SALARIES: {salaries.count()} | Total: {total:,.0f} DH\n"
                for s in salaries[:5]:
                    context += f"- {s.nom} {s.prenom} | {s.salaire_base:,.0f} DH\n"

            if 'chantiers' in modules:
                chantiers = Chantier.objects.all()
                context += f"CHANTIERS: {chantiers.count()} | En cours: {chantiers.filter(etat='en_cours').count()} | Terminés: {chantiers.filter(etat='termine').count()}\n"
                for c in chantiers[:5]:
                    context += f"- {c.nom} | {c.etat}\n"

            if 'general' in modules or not modules:
                solde_caisse = SoldeCaisse.objects.first()
                solde_banque = SoldeInitial.objects.first()
                total_charges = ChargeFix.objects.aggregate(t=Sum('montant'))['t'] or 0
                fournisseurs_all = list(Fournisseur.objects.all())
                depasses = len([f for f in fournisseurs_all if f.etat_regularite == 'depasee'])
                context += f"RESUME: Caisse:{solde_caisse.montant if solde_caisse else 0:,.0f} DH | Banque:{solde_banque.montant if solde_banque else 0:,.0f} DH | Charges:{total_charges:,.0f} DH | Fournisseurs dépassés:{depasses} | Chantiers en cours:{Chantier.objects.filter(etat='en_cours').count()}\n"

        except Exception as e:
            context += f"Erreur: {str(e)}\n"

        return context

    def run(self, question, modules=None, username="utilisateur", history=""):
        if modules is None:
            modules = ['general']

        data = self.get_data(modules)

        prompt = f"""Tu es NEWIRIS AI. Réponds UNIQUEMENT en français, de façon concise et professionnelle.
NE MENTIONNE PAS d'erreurs, de modèles IA, ou de services externes.
Date: {timezone.now().strftime('%d/%m/%Y')} | User: {username}
{f"Historique: {history[-300:]}" if history else ""}
Données réelles: {data[:1000]}
Question: {question}
Réponse directe et concise:"""

        return self.call_ollama(prompt, temperature=0.3, max_tokens=400)