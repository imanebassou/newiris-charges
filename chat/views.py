from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from ai_core.orchestrator import AIOrchestrator
from .models import ChatMessage


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').strip()
        if not question:
            return Response({'error': 'Question vide'}, status=400)

        try:
            orchestrator = AIOrchestrator(user=request.user)
            result = orchestrator.process(question)
            return Response(result)
        except Exception as e:
            return Response({'error': f'Erreur: {str(e)}'}, status=500)


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