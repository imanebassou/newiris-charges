from django.urls import path
from .views import ChargeVariableListView, ChargeVariableDetailView

urlpatterns = [
    path('', ChargeVariableListView.as_view(), name='chargevariable-list'),
    path('<int:pk>/', ChargeVariableDetailView.as_view(), name='chargevariable-detail'),
]