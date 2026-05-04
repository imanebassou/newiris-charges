from decimal import Decimal
from hashlib import sha1

from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NewIrisDashboardRecord


class NewIrisDashboardSyncView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.headers.get('X-SYNC-TOKEN', '')
        if token != 'CHANGE_ME_SYNC_TOKEN':
            return Response(
                {'detail': 'Token invalide.'},
                status=status.HTTP_403_FORBIDDEN
            )

        rows = request.data.get('rows', [])
        if not isinstance(rows, list):
            return Response(
                {'detail': 'Le champ rows doit etre une liste.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        synced = 0

        for row in rows:
            annee = int(row.get('annee') or 0)
            mois = int(row.get('mois') or 0)
            devis = str(row.get('devis') or '').strip()
            chantier = str(row.get('chantier') or '').strip()

            raw_key = f"{annee}|{mois}|{devis}|{chantier}"
            source_key = sha1(raw_key.encode('utf-8')).hexdigest()

            date_validation = row.get('date_validation')
            parsed_date = parse_datetime(date_validation) if date_validation else None

            NewIrisDashboardRecord.objects.update_or_create(
                source_key=source_key,
                defaults={
                    'annee': annee,
                    'mois': mois,
                    'date_validation': parsed_date,
                    'devis': devis,
                    'etat_po': str(row.get('etat_po') or '').strip(),
                    'etat_facture': str(row.get('etat_facture') or '').strip(),
                    'service_newiris': str(row.get('service_newiris') or '').strip(),
                    'client': str(row.get('client') or '').strip(),
                    'contact': str(row.get('contact') or '').strip(),
                    'service_client': str(row.get('service_client') or '').strip(),
                    'categorie': str(row.get('categorie') or '').strip(),
                    'chantier': chantier,
                    'ca_ht': Decimal(str(row.get('ca_ht') or 0)),
                    'ca_ttc': Decimal(str(row.get('ca_ttc') or 0)),
                }
            )
            synced += 1

        return Response({
            'message': 'Synchronisation terminee.',
            'rows_received': len(rows),
            'rows_synced': synced,
        })
