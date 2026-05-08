from chat.models import ChatMessage


class ConversationMemory:

    def __init__(self, user, max_messages=6):
        self.user = user
        self.max_messages = max_messages

    def get_history(self):
        messages = ChatMessage.objects.filter(
            user=self.user
        ).order_by('-created_at')[:self.max_messages]
        history = []
        for msg in reversed(messages):
            history.append({"role": "user", "content": msg.question})
            history.append({"role": "assistant", "content": msg.reponse})
        return history

    def save(self, question, reponse, modules=[]):
        ChatMessage.objects.create(
            user=self.user,
            question=question,
            reponse=reponse,
            modules_utilises=modules
        )

    def get_context_string(self):
        history = self.get_history()
        if not history:
            return ""
        context = ""
        for msg in history[-4:]:
            role = "User" if msg["role"] == "user" else "AI"
            context += f"{role}: {msg['content'][:100]}\n"
        return context

    def clear(self):
        ChatMessage.objects.filter(user=self.user).delete()