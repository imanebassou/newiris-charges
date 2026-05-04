from datetime import timedelta
from email.mime.image import MIMEImage
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from users.models import CustomUser, UserPagePermission

from .models import Fournisseur


REMINDER_INTERVAL_HOURS = 24


def get_fournisseurs_recipients():
    recipient_ids = UserPagePermission.objects.filter(
        page__code='fournisseurs',
        can_view=True,
    ).values_list('user_id', flat=True)

    return list(
        CustomUser.objects.filter(id__in=recipient_ids)
        .exclude(email='')
        .exclude(email__isnull=True)
        .values_list('email', flat=True)
        .distinct()
    )


def build_regularite_context(fournisseur: Fournisseur):
    return {
        'fournisseur': fournisseur,
        'etat_regularite_label': 'Depassee',
        'echeance': fournisseur.echeance,
        'date_fin_rf': fournisseur.date_fin_rf,
        'year': timezone.now().year,
    }


def send_regularite_depassee_email(fournisseur: Fournisseur):
    recipients = get_fournisseurs_recipients()
    if not recipients:
        return False

    context = build_regularite_context(fournisseur)
    subject = f"[NEWIRIS] Regularite depassee - {fournisseur.nom}"
    text_body = render_to_string('fournisseurs/emails/regularite_depassee.txt', context)
    html_body = render_to_string('fournisseurs/emails/regularite_depassee.html', context)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        to=recipients,
    )
    message.attach_alternative(html_body, 'text/html')

    logo_path = Path(settings.BASE_DIR) / 'frontend' / 'src' / 'assets' / 'newiris_logo.jpg'
    if logo_path.exists():
        with logo_path.open('rb') as logo_file:
            logo = MIMEImage(logo_file.read())
            logo.add_header('Content-ID', '<newiris-logo>')
            logo.add_header('Content-Disposition', 'inline', filename='newiris_logo.jpg')
            message.attach(logo)

    message.send(fail_silently=False)
    return True


def should_send_reminder(fournisseur: Fournisseur):
    if fournisseur.etat_regularite != 'depasee':
        return False

    if not fournisseur.regularite_depassee_notified_at:
        return True

    next_allowed_send = fournisseur.regularite_depassee_notified_at + timedelta(hours=REMINDER_INTERVAL_HOURS)
    return timezone.now() >= next_allowed_send


def notify_overdue_fournisseurs_once(queryset=None):
    fournisseurs = queryset if queryset is not None else Fournisseur.objects.all()

    sent_ids = []
    for fournisseur in fournisseurs:
        if not should_send_reminder(fournisseur):
            continue

        sent = send_regularite_depassee_email(fournisseur)
        if sent:
            fournisseur.regularite_depassee_notified_at = timezone.now()
            fournisseur.save(update_fields=['regularite_depassee_notified_at'])
            sent_ids.append(fournisseur.id)

    return sent_ids
