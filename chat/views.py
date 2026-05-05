import requests
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from commandes.models import Commande
from fournisseurs.models import Fournisseur
from charges_fixes.models import ChargeFix
from charges_variables.models import ChargeVariable
from caisse.models import ActionCaisse
from banque.models import ActionBanque
from cheques.models import DemandeCheque
from salaires.models import Salarie
from chantiers.models import Chantier
from .models import ChatMessage

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
MODEL = "phi3:mini"

def get_context_metier(question):
    question_lower = question.lower()
    context = ""
    modules = []

    try:
        if any(w in question_lower for w in ['commande', 'achat', 'bon de commande']):
            commandes = Commande.objects.all()[:20]
            context += f"\nCOMMANDES ({commandes.count()} récentes):\n"
            for c in commandes:
                context += f"- {c}\n"
            modules.append('commandes')

        if any(w in question_lower for w in ['fournisseur', 'supplier']):
            fournisseurs = Fournisseur.objects.all()[:20]
            context += f"\nFOURNISSEURS ({fournisseurs.count()}):\n"
            for f in fournisseurs:
                context += f"- {f}\n"
            modules.append('fournisseurs')

        if any(w in question_lower for w in ['charge fixe', 'charges fixes']):
            charges = ChargeFix.objects.all()[:20]
            total = charges.aggregate(total=Sum('montant'))['total'] or 0
            context += f"\nCHARGES FIXES - Total: {total} DH\n"
            for c in charges:
                context += f"- {c}\n"
            modules.append('charges_fixes')

        if any(w in question_lower for w in ['charge variable', 'charges variables']):
            charges = ChargeVariable.objects.all()[:20]
            total = charges.aggregate(total=Sum('montant'))['total'] or 0
            context += f"\nCHARGES VARIABLES - Total: {total} DH\n"
            modules.append('charges_variables')

        if any(w in question_lower for w in ['caisse', 'espece']):
            actions = ActionCaisse.objects.all()[:20]
            context += f"\nCAISSE:\n"
            for a in actions:
                context += f"- {a}\n"
            modules.append('caisse')

        if any(w in question_lower for w in ['banque', 'virement']):
            actions = ActionBanque.objects.all()[:20]
            context += f"\nBANQUE:\n"
            for a in actions:
                context += f"- {a}\n"
            modules.append('banque')

        if any(w in question_lower for w in ['cheque', 'cheques']):
            cheques = DemandeCheque.objects.all()[:20]
            context += f"\nCHEQUES:\n"
            for c in cheques:
                context += f"- {c}\n"
            modules.append('cheques')

        if any(w in question_lower for w in ['salaire', 'paie', 'employe', 'salarie']):
            salaries = Salarie.objects.all()[:20]
            total = salaries.aggregate(total=Sum('salaire_base'))['total'] or 0
            context += f"\nSALARIES - Total salaires base: {total} DH\n"
            for s in salaries:
                context += f"- {s}\n"
            modules.append('salaires')

        if any(w in question_lower for w in ['chantier', 'projet']):
            chantiers = Chantier.objects.all()[:20]
            context += f"\nCHANTIERS:\n"
            for c in chantiers:
                context += f"- {c}\n"
            modules.append('chantiers')

    except Exception as e:
        context += f"\nErreur recuperation donnees: {str(e)}\n"

    return context, modules


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '')
        if not question:
            return Response({'error': 'Question vide'}, status=400)

        context, modules = get_context_metier(question)

        prompt = f"""Tu es l'assistant intelligent de NEWIRIS, une entreprise de batiments intelligents a Tanger.
Tu reponds uniquement en francais, de maniere claire et professionnelle.
Tu as acces aux donnees suivantes de l'entreprise :
{context if context else "Aucune donnee specifique trouvee pour cette question."}

Question de l'utilisateur : {question}

Reponds de maniere utile et concise."""

        try:
            response = requests.post(OLLAMA_URL, json={
    "model": MODEL,
    "prompt": prompt,
    "stream": False
}, timeout=120)  # ← change 60 à 120

            reponse_text = response.json().get('response', '')

            ChatMessage.objects.create(
                user=request.user,
                question=question,
                reponse=reponse_text,
                modules_utilises=modules
            )

            return Response({
                'reponse': reponse_text,
                'modules': modules
            })

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