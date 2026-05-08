from django.urls import path
from .views import DocumentExtractView

urlpatterns = [
    path('extract/', DocumentExtractView.as_view(), name='document-extract'),
]