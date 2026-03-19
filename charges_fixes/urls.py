from django.urls import path
from .views import ChargeFixListView, ChargeFixDetailView

urlpatterns = [
    path('', ChargeFixListView.as_view(), name='chargefix-list'),
    path('<int:pk>/', ChargeFixDetailView.as_view(), name='chargefix-detail'),
]