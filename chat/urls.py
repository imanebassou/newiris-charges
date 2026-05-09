from django.urls import path
from .views import ChatView, ChatHistoryView, ChatDeleteView

urlpatterns = [
    path('', ChatView.as_view(), name='chat'),
    path('history/', ChatHistoryView.as_view(), name='chat-history'),
    path('history/<int:pk>/', ChatDeleteView.as_view(), name='chat-delete'),
]