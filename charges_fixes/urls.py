from django.urls import path
from .views import (
    ChargeFixListView,
    ChargeFixDetailView,
    ChargeFixCategoryListCreateView,
    ChargeFixCategoryDetailView,
)

urlpatterns = [
    path('', ChargeFixListView.as_view(), name='chargefix-list'),
    path('categories/', ChargeFixCategoryListCreateView.as_view(), name='chargefix-category-list'),
    path('categories/<int:pk>/', ChargeFixCategoryDetailView.as_view(), name='chargefix-category-detail'),
    path('<int:pk>/', ChargeFixDetailView.as_view(), name='chargefix-detail'),
]
