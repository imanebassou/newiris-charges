import requests
from django.db.models import Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from commandes.models import Commande
from fournisseurs.models import Fournisseur
from charges_fixes.models import ChargeFix, ChargeFixCategory
from caisse.models import ActionCaisse, SoldeCaisse, CaissePersonnelle
from banque.models import ActionBanque, SoldeInitial
from cheques.models import DemandeCheque
from salaires.models import Salarie
from chantiers.models import Chantier
from .models import ChatMessage

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "phi3:mini"

REPONSES_RAPIDES = {
    ('bonjour', 'salut', 'bonsoir', 'hello', 'hi', 'salam'):
        "Bonjour ! Je suis l'assistant NEWIRIS. Je peux vous aider sur les charges, commandes, fournisseurs, caisse, banque, chèques, salaires et chantiers. Que voulez-vous savoir ?",
    ('merci', 'thank', 'shukran'):
        "De rien ! N'hésitez pas si vous avez d'autres questions.",
    ('aide', 'help', 'que peux tu faire', 'capabilities'):
        "Je peux répondre sur : les charges fixes/variables, commandes, fournisseurs, caisse, banque, chèques, salaires, chantiers. Posez-moi une question sur l'un de ces modules !",
}


def get_reponse_rapide(question_lower):
    for mots_cles, reponse in REPONSES_RAPIDES.items():
        if any(w in question_lower for w in mots_cles):
            return reponse
    return None


def get_context_metier(question):
    question_lower = question.lower()
    context = ""
    modules = []

    try:
        # COMMANDES
        if any(w in question_lower for w in ['commande', 'achat', 'bon de commande', 'validation']):
            commandes = Commande.objects.all()[:20]
            total = commandes.aggregate(total=Sum('montant'))['total'] or 0
            en_attente = commandes.filter(validation_direction='en_attente').count()
            context += f"\nCOMMANDES:\n"
            context += f"- Total: {commandes.count()} | Montant total: {total} DH\n"
            context += f"- En attente validation direction: {en_attente}\n"
            for c in commandes[:10]:
                context += f"  * {c.titre} | {c.montant} DH | {c.fournisseur} | dir: {c.validation_direction} | fin: {c.validation_finance}\n"
            modules.append('commandes')

        # FOURNISSEURS
        if any(w in question_lower for w in ['fournisseur', 'contrat', 'regularite', 'echeance']):
            fournisseurs = list(Fournisseur.objects.all())
            depasses = [f for f in fournisseurs if f.etat_regularite == 'depasee']
            en_cours = [f for f in fournisseurs if f.etat_regularite == 'en_cours']
            context += f"\nFOURNISSEURS:\n"
            context += f"- Total: {len(fournisseurs)} | En cours: {len(en_cours)} | Dépassés: {len(depasses)}\n"
            for f in fournisseurs[:10]:
                context += f"  * {f.nom} | {f.type_contrat} | échéance: {f.date_fin_rf} | état: {f.etat_regularite}\n"
            modules.append('fournisseurs')

        # CHARGES FIXES
        if any(w in question_lower for w in ['charge fixe', 'charges fixes', 'charge']):
            charges = ChargeFix.objects.all()
            total = charges.aggregate(total=Sum('montant'))['total'] or 0
            categories = ChargeFixCategory.objects.all()
            context += f"\nCHARGES FIXES:\n"
            context += f"- Total: {total} DH | Nombre: {charges.count()}\n"
            for c in charges[:10]:
                context += f"  * {c.categorie} | {c.montant} DH | service: {c.service}\n"
            context += f"- Catégories: {', '.join([cat.nom for cat in categories])}\n"
            modules.append('charges_fixes')

        # CAISSE
        if any(w in question_lower for w in ['caisse', 'espece', 'solde caisse']):
            solde = SoldeCaisse.objects.first()
            total_entree = ActionCaisse.objects.filter(type='entree', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
            total_sortie = ActionCaisse.objects.filter(type='sortie', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
            caisses = CaissePersonnelle.objects.all()
            context += f"\nCAISSE:\n"
            context += f"- Solde principal: {solde.montant if solde else 0} DH\n"
            context += f"- Entrées traitées: {total_entree} DH | Sorties traitées: {total_sortie} DH\n"
            context += f"- Caisses: {', '.join([c.nom for c in caisses])}\n"
            modules.append('caisse')

        # BANQUE
        if any(w in question_lower for w in ['banque', 'virement', 'solde banque']):
            solde_initial = SoldeInitial.objects.first()
            total_entree = ActionBanque.objects.filter(type='entree', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
            total_sortie = ActionBanque.objects.filter(type='sortie', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
            en_cours = ActionBanque.objects.filter(statut='en_cours')
            context += f"\nBANQUE:\n"
            context += f"- Solde initial: {solde_initial.montant if solde_initial else 0} DH\n"
            context += f"- Entrées traitées: {total_entree} DH | Sorties traitées: {total_sortie} DH\n"
            context += f"- Opérations en cours: {en_cours.count()}\n"
            for a in en_cours[:5]:
                context += f"  * {a.titre} | {a.type} | {a.montant} DH | {a.date}\n"
            modules.append('banque')

        # CHEQUES
        if any(w in question_lower for w in ['cheque', 'cheques', 'signature']):
            cheques = DemandeCheque.objects.all()
            total = cheques.aggregate(t=Sum('montant'))['t'] or 0
            context += f"\nCHEQUES:\n"
            context += f"- Total: {cheques.count()} | Montant: {total} DH\n"
            context += f"- En validation: {cheques.filter(statut_ticket='en_validation').count()}\n"
            context += f"- En attente signature: {cheques.filter(statut_ticket='en_attente_signature').count()}\n"
            for c in cheques[:10]:
                context += f"  * {c.titre} | {c.montant} DH | {c.statut_ticket}\n"
            modules.append('cheques')

        # SALAIRES
        if any(w in question_lower for w in ['salaire', 'paie', 'employe', 'salarie', 'staff']):
            salaries = Salarie.objects.all()
            total = salaries.aggregate(t=Sum('salaire_base'))['t'] or 0
            context += f"\nSALARIES:\n"
            context += f"- Nombre: {salaries.count()} | Total base: {total} DH\n"
            for s in salaries[:10]:
                context += f"  * {s.nom} {s.prenom} | {s.salaire_base} DH\n"
            modules.append('salaires')

        # CHANTIERS
        if any(w in question_lower for w in ['chantier', 'projet', 'travaux', 'site']):
            chantiers = Chantier.objects.all()
            context += f"\nCHANTIERS:\n"
            context += f"- Total: {chantiers.count()} | En cours: {chantiers.filter(etat='en_cours').count()} | Terminés: {chantiers.filter(etat='termine').count()} | Bloqués: {chantiers.filter(etat='bloque').count()}\n"
            for c in chantiers[:10]:
                context += f"  * {c.nom} | {c.etat}\n"
            modules.append('chantiers')

        # RESUME GENERAL
        if any(w in question_lower for w in ['resume', 'situation', 'general', 'dashboard', 'bilan', 'apercu', 'synthese']):
            solde_caisse = SoldeCaisse.objects.first()
            solde_banque = SoldeInitial.objects.first()
            total_charges = ChargeFix.objects.aggregate(t=Sum('montant'))['t'] or 0
            total_commandes = Commande.objects.aggregate(t=Sum('montant'))['t'] or 0
            fournisseurs_all = list(Fournisseur.objects.all())
            fournisseurs_depasses = len([f for f in fournisseurs_all if f.etat_regularite == 'depasee'])
            context += f"\nRESUME GENERAL NEWIRIS:\n"
            context += f"- Solde caisse: {solde_caisse.montant if solde_caisse else 0} DH\n"
            context += f"- Solde banque initial: {solde_banque.montant if solde_banque else 0} DH\n"
            context += f"- Total charges fixes: {total_charges} DH\n"
            context += f"- Total commandes: {total_commandes} DH\n"
            context += f"- Chèques en attente signature: {DemandeCheque.objects.filter(statut_ticket='en_attente_signature').count()}\n"
            context += f"- Fournisseurs dépassés: {fournisseurs_depasses}\n"
            context += f"- Chantiers en cours: {Chantier.objects.filter(etat='en_cours').count()}\n"
            modules.append('resume')

    except Exception as e:
        context += f"\nErreur: {str(e)}\n"

    return context, modules


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').strip()
        if not question:
            return Response({'error': 'Question vide'}, status=400)

        question_lower = question.lower()

        # Réponses rapides sans Ollama
        reponse_rapide = get_reponse_rapide(question_lower)
        if reponse_rapide:
            ChatMessage.objects.create(
                user=request.user,
                question=question,
                reponse=reponse_rapide,
                modules_utilises=[]
            )
            return Response({'reponse': reponse_rapide, 'modules': []})

        context, modules = get_context_metier(question)

        prompt = f"""Tu es l'assistant de NEWIRIS, entreprise de batiments intelligents a Tanger.
Reponds UNIQUEMENT en francais, clairement et concisement.
Date: {timezone.now().strftime('%d/%m/%Y')}

{f"DONNEES: {context}" if context else "Reponds de maniere generale sur NEWIRIS."}

Question: {question}
Reponse courte et precise:"""

        try:
            response = requests.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 300,
                    "temperature": 0.3,
                    "top_p": 0.9,
                }
            }, timeout=120)

            reponse_text = response.json().get('response', '')

            ChatMessage.objects.create(
                user=request.user,
                question=question,
                reponse=reponse_text,
                modules_utilises=modules
            )

            return Response({'reponse': reponse_text, 'modules': modules})

        except Exception as e:
            return Response({'error': f'Erreur Ollama: {str(e)}'}, status=500)


class ChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user)[:50]
        data = [{
            'id': m.id,
            'question': m.question,
            'reponse': m.reponse,
            'modules': m.modules_utilises,
            'created_at': m.created_at
        } for m in messages]
        return Response(data)