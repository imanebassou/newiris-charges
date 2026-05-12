from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date, timedelta
from .base_agent import BaseAgent

from commandes.models import Commande
from fournisseurs.models import Fournisseur
from charges_fixes.models import ChargeFix
from charges_variables.models import ChargeVariable
from caisse.models import ActionCaisse, SoldeCaisse, CaissePersonnelle
from banque.models import ActionBanque, SoldeInitial
from cheques.models import DemandeCheque
from salaires.models import Salarie
from chantiers.models import Chantier
from previsions.models import Prevision
from vehicules.models import Vehicule


class MetierAgent(BaseAgent):

    def __init__(self):
        super().__init__(
            name="MetierAgent",
            description="Agent métier NEWIRIS"
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _fmt(self, montant):
        try:
            return f"{float(montant):,.0f} DH"
        except (TypeError, ValueError):
            return "0 DH"

    def _fmt_date(self, d):
        if not d:
            return "—"
        MOIS = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"]
        return f"{d.day} {MOIS[d.month - 1]} {d.year}"

    # ------------------------------------------------------------------
    # Data builders
    # ------------------------------------------------------------------

    def _data_commandes(self):
        qs = Commande.objects.all()
        total = qs.aggregate(t=Sum('montant'))['t'] or 0
        en_attente_dir = qs.filter(validation_direction='en_attente').count()
        en_attente_fin = qs.filter(validation_finance='en_attente').count()
        validees = qs.filter(validation_direction='ok', validation_finance='ok').count()
        refusees = qs.filter(Q(validation_direction='nok') | Q(validation_finance='nok')).count()

        lines = [
            f"COMMANDES — {qs.count()} total | Montant total: {self._fmt(total)}",
            f"  En attente direction: {en_attente_dir} | En attente finance: {en_attente_fin}",
            f"  Validées: {validees} | Refusées: {refusees}",
        ]
        for c in qs.order_by('-created_at')[:8]:
            fournisseur = c.fournisseur.nom if c.fournisseur else "—"
            montant = self._fmt(c.montant) if c.montant else "non renseigné"
            lines.append(
                f"  • {c.titre} | {fournisseur} | {montant} "
                f"| Dir:{c.validation_direction} Fin:{c.validation_finance}"
            )
        return "\n".join(lines)

    def _data_fournisseurs(self):
        fournisseurs = list(Fournisseur.objects.all().order_by('date_fin_rf'))
        depasses = [f for f in fournisseurs if f.etat_regularite == 'depasee']
        bientot = [f for f in fournisseurs if 0 < f.echeance <= 30]
        en_cours = [f for f in fournisseurs if f.etat_regularite == 'en_cours']

        lines = [
            f"FOURNISSEURS — {len(fournisseurs)} total",
            f"  Dépassés: {len(depasses)} | Expirent dans 30j: {len(bientot)} | En cours: {len(en_cours)}",
        ]
        if depasses:
            lines.append("  Régularité dépassée:")
            for f in depasses[:5]:
                lines.append(f"    • {f.nom} | {f.type_contrat} | échu le {self._fmt_date(f.date_fin_rf)}")
        if bientot:
            lines.append("  Expirent bientôt (<30j):")
            for f in bientot[:5]:
                lines.append(f"    • {f.nom} | {f.type_contrat} | dans {f.echeance}j ({self._fmt_date(f.date_fin_rf)})")
        for f in en_cours[:4]:
            lines.append(f"  • {f.nom} | {f.type_contrat} | expire dans {f.echeance}j")
        return "\n".join(lines)

    def _data_charges_fixes(self):
        qs = ChargeFix.objects.select_related('service').all()
        total = qs.aggregate(t=Sum('montant'))['t'] or 0
        by_cat = qs.values('categorie').annotate(t=Sum('montant')).order_by('-t')
        lines = [f"CHARGES FIXES — {qs.count()} entrées | Total mensuel: {self._fmt(total)}"]
        for item in by_cat[:8]:
            lines.append(f"  • {item['categorie']}: {self._fmt(item['t'])}")
        return "\n".join(lines)

    def _data_charges_variables(self):
        today = date.today()
        mois_debut = today.replace(day=1)
        qs_mois = ChargeVariable.objects.filter(date__gte=mois_debut)
        qs_all = ChargeVariable.objects.all()
        total_mois = qs_mois.aggregate(t=Sum('montant'))['t'] or 0
        total_all = qs_all.aggregate(t=Sum('montant'))['t'] or 0
        en_cours = qs_all.filter(statut='en_cours').count()
        by_cat = qs_mois.values('categorie').annotate(t=Sum('montant')).order_by('-t')

        lines = [
            f"CHARGES VARIABLES — Ce mois: {self._fmt(total_mois)} | Total: {self._fmt(total_all)}",
            f"  En cours de traitement: {en_cours}",
        ]
        for item in by_cat[:6]:
            lines.append(f"  • {item['categorie']}: {self._fmt(item['t'])} ce mois")
        for c in qs_all.order_by('-date')[:5]:
            lines.append(f"  • {c.titre} | {c.categorie} | {self._fmt(c.montant)} | {self._fmt_date(c.date)} | {c.statut}")
        return "\n".join(lines)

    def _data_caisse(self):
        solde = SoldeCaisse.objects.first()
        today = date.today()
        mois_debut = today.replace(day=1)
        entrees_total = ActionCaisse.objects.filter(type='entree', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
        sorties_total = ActionCaisse.objects.filter(type='sortie', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
        entrees_mois = ActionCaisse.objects.filter(type='entree', statut='traitee', date__gte=mois_debut).aggregate(t=Sum('montant'))['t'] or 0
        sorties_mois = ActionCaisse.objects.filter(type='sortie', statut='traitee', date__gte=mois_debut).aggregate(t=Sum('montant'))['t'] or 0
        en_cours = ActionCaisse.objects.filter(statut='en_cours').count()
        caisses = CaissePersonnelle.objects.all()

        lines = [
            f"CAISSE — Solde actuel: {self._fmt(solde.montant if solde else 0)}",
            f"  Ce mois: Entrées {self._fmt(entrees_mois)} | Sorties {self._fmt(sorties_mois)}",
            f"  Total historique: Entrées {self._fmt(entrees_total)} | Sorties {self._fmt(sorties_total)}",
            f"  Opérations en cours: {en_cours}",
        ]
        if caisses.exists():
            lines.append("  Caisses personnelles:")
            for cp in caisses:
                lines.append(f"    • {cp.nom}: {self._fmt(cp.solde_calcule)}")
        for a in ActionCaisse.objects.order_by('-date')[:5]:
            lines.append(f"  • {a.titre} | {a.type} | {self._fmt(a.montant)} | {self._fmt_date(a.date)} | {a.statut}")
        return "\n".join(lines)

    def _data_banque(self):
        solde = SoldeInitial.objects.first()
        today = date.today()
        mois_debut = today.replace(day=1)
        entrees_total = ActionBanque.objects.filter(type='entree', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
        sorties_total = ActionBanque.objects.filter(type='sortie', statut='traitee').aggregate(t=Sum('montant'))['t'] or 0
        entrees_mois = ActionBanque.objects.filter(type='entree', statut='traitee', date__gte=mois_debut).aggregate(t=Sum('montant'))['t'] or 0
        sorties_mois = ActionBanque.objects.filter(type='sortie', statut='traitee', date__gte=mois_debut).aggregate(t=Sum('montant'))['t'] or 0
        en_cours_count = ActionBanque.objects.filter(statut='en_cours').count()
        en_cours_montant = ActionBanque.objects.filter(statut='en_cours').aggregate(t=Sum('montant'))['t'] or 0

        lines = [
            f"BANQUE — Solde initial: {self._fmt(solde.montant if solde else 0)}",
            f"  Ce mois: Entrées {self._fmt(entrees_mois)} | Sorties {self._fmt(sorties_mois)}",
            f"  Total historique: Entrées {self._fmt(entrees_total)} | Sorties {self._fmt(sorties_total)}",
            f"  En cours: {en_cours_count} opérations ({self._fmt(en_cours_montant)})",
        ]
        for a in ActionBanque.objects.order_by('-date')[:5]:
            lines.append(f"  • {a.titre} | {a.type} | {self._fmt(a.montant)} | {self._fmt_date(a.date)} | {a.statut}")
        return "\n".join(lines)

    def _data_cheques(self):
        qs = DemandeCheque.objects.all()
        total = qs.aggregate(t=Sum('montant'))['t'] or 0
        en_validation = qs.filter(statut_ticket='en_validation').count()
        en_attente_sig = qs.filter(statut_ticket='en_attente_signature').count()
        signes = qs.filter(statut_ticket='cheque_signe').count()
        livres = qs.filter(statut_ticket='livre_a_equipe').count()
        traites = qs.filter(statut_ticket='traitee').count()

        lines = [
            f"CHÈQUES — {qs.count()} total | {self._fmt(total)}",
            f"  En validation: {en_validation} | En attente signature: {en_attente_sig}",
            f"  Signés: {signes} | Livrés équipe: {livres} | Traités: {traites}",
        ]
        for c in qs.filter(statut_ticket='en_attente_signature').order_by('date_souhaitee_signature')[:5]:
            fournisseur = c.fournisseur.nom if c.fournisseur else "—"
            lines.append(f"  URGENT • {c.titre} | {fournisseur} | {self._fmt(c.montant)} | souhaité: {self._fmt_date(c.date_souhaitee_signature)}")
        for c in qs.order_by('-created_at')[:5]:
            fournisseur = c.fournisseur.nom if c.fournisseur else "—"
            lines.append(f"  • {c.titre} | {fournisseur} | {self._fmt(c.montant)} | {c.statut_ticket}")
        return "\n".join(lines)

    def _data_salaires(self):
        salaries = Salarie.objects.all()
        total_masse = salaries.aggregate(t=Sum('salaire_base'))['t'] or 0
        today = date.today()
        actifs = salaries.filter(date_debut__lte=today, date_fin__gte=today).count()

        lines = [
            f"SALAIRES — {salaries.count()} salariés | Masse salariale: {self._fmt(total_masse)}/mois",
            f"  Contrats actifs: {actifs}",
        ]
        for s in salaries.order_by('nom')[:8]:
            lines.append(f"  • {s.nom} {s.prenom} | {self._fmt(s.salaire_base)} | {self._fmt_date(s.date_debut)} → {self._fmt_date(s.date_fin)}")
        return "\n".join(lines)

    def _data_chantiers(self):
        qs = Chantier.objects.all()
        lines = [
            f"CHANTIERS — {qs.count()} total",
            f"  Confirmés: {qs.filter(etat='confirme').count()} | En cours: {qs.filter(etat='en_cours').count()} | Bloqués: {qs.filter(etat='bloque').count()} | Terminés: {qs.filter(etat='termine').count()} | Réceptionnés: {qs.filter(etat='receptionne').count()}",
        ]
        bloques = qs.filter(etat='bloque')
        if bloques.exists():
            lines.append("  Bloqués:")
            for c in bloques[:4]:
                lines.append(f"    • {c.nom}")
        for c in qs.filter(etat='en_cours')[:6]:
            lines.append(f"  • {c.nom} | en cours")
        for c in qs.filter(etat='confirme')[:3]:
            lines.append(f"  • {c.nom} | confirmé")
        return "\n".join(lines)

    def _data_previsions(self):
        today = date.today()
        qs_mois = Prevision.objects.filter(mois=today.month, annee=today.year).exclude(exclure_du_calcul=True)
        entrees = qs_mois.filter(type='entree').aggregate(t=Sum('montant'))['t'] or 0
        sorties = qs_mois.filter(type='sortie').aggregate(t=Sum('montant'))['t'] or 0
        traitees = qs_mois.filter(statut='traitee').count()
        en_cours = qs_mois.filter(statut='en_cours').count()

        lines = [
            f"PRÉVISIONS — {today.month}/{today.year}",
            f"  Entrées: {self._fmt(entrees)} | Sorties: {self._fmt(sorties)} | Solde net: {self._fmt(entrees - sorties)}",
            f"  Traitées: {traitees} | En cours: {en_cours}",
        ]
        for semaine in range(1, 5):
            qs_s = qs_mois.filter(semaine=semaine)
            if qs_s.exists():
                e = qs_s.filter(type='entree').aggregate(t=Sum('montant'))['t'] or 0
                s = qs_s.filter(type='sortie').aggregate(t=Sum('montant'))['t'] or 0
                lines.append(f"  Semaine {semaine}: +{self._fmt(e)} / -{self._fmt(s)}")
        for p in qs_mois.filter(statut='en_cours').order_by('date_prevision')[:5]:
            lines.append(f"  • S{p.semaine} {p.titre} | {p.type} | {self._fmt(p.montant)} | {self._fmt_date(p.date_prevision)}")
        return "\n".join(lines)

    def _data_vehicules(self):
        qs = Vehicule.objects.all()
        lines = [
            f"VÉHICULES — {qs.count()} total | En panne: {qs.filter(etat_voiture='en_panne').count()}",
            f"  Assurance dépassée: {qs.filter(etat_assurance='depasee').count()} | Vignette dépassée: {qs.filter(etat_vignette='depasee').count()} | Vidange dépassée: {qs.filter(etat_vidange='depasee').count()}",
        ]
        for v in qs.order_by('nom')[:8]:
            alerts = []
            if v.etat_assurance == 'depasee': alerts.append('assurance⚠')
            if v.etat_vignette == 'depasee': alerts.append('vignette⚠')
            if v.etat_vidange == 'depasee': alerts.append('vidange⚠')
            alert_str = " | " + ", ".join(alerts) if alerts else ""
            lines.append(f"  • {v.nom} ({v.matricule}) | {v.etat_voiture}{alert_str}")
        return "\n".join(lines)

    def _data_general(self):
        today = date.today()
        mois_debut = today.replace(day=1)

        solde_caisse = SoldeCaisse.objects.first()
        solde_banque = SoldeInitial.objects.first()
        total_charges_fixes = ChargeFix.objects.aggregate(t=Sum('montant'))['t'] or 0
        charges_var_mois = ChargeVariable.objects.filter(date__gte=mois_debut).aggregate(t=Sum('montant'))['t'] or 0

        fournisseurs_all = list(Fournisseur.objects.all())
        depasses = [f for f in fournisseurs_all if f.etat_regularite == 'depasee']
        bientot_expire = [f for f in fournisseurs_all if 0 < f.echeance <= 30]

        cheques_sig = DemandeCheque.objects.filter(statut_ticket='en_attente_signature').count()
        cheques_sig_montant = DemandeCheque.objects.filter(statut_ticket='en_attente_signature').aggregate(t=Sum('montant'))['t'] or 0

        cmd_attente = Commande.objects.filter(validation_direction='en_attente').count()
        chantiers_en_cours = Chantier.objects.filter(etat='en_cours').count()
        chantiers_bloques = Chantier.objects.filter(etat='bloque').count()

        prev_entrees = Prevision.objects.filter(mois=today.month, annee=today.year, type='entree').exclude(exclure_du_calcul=True).aggregate(t=Sum('montant'))['t'] or 0
        prev_sorties = Prevision.objects.filter(mois=today.month, annee=today.year, type='sortie').exclude(exclure_du_calcul=True).aggregate(t=Sum('montant'))['t'] or 0

        lines = [
            f"=== TABLEAU DE BORD NEWIRIS — {self._fmt_date(today)} ===",
            "",
            "TRÉSORERIE:",
            f"  Caisse: {self._fmt(solde_caisse.montant if solde_caisse else 0)}",
            f"  Banque: {self._fmt(solde_banque.montant if solde_banque else 0)}",
            f"  Charges fixes mensuelles: {self._fmt(total_charges_fixes)}",
            f"  Charges variables ce mois: {self._fmt(charges_var_mois)}",
            f"  Prévisions {today.month}/{today.year}: +{self._fmt(prev_entrees)} / -{self._fmt(prev_sorties)} = {self._fmt(prev_entrees - prev_sorties)}",
            "",
            "ALERTES:",
        ]
        if depasses:
            lines.append(f"  URGENT — {len(depasses)} fournisseur(s) régularité dépassée: {', '.join(f.nom for f in depasses[:3])}")
        if bientot_expire:
            lines.append(f"  ATTENTION — {len(bientot_expire)} fournisseur(s) expirent dans 30j: {', '.join(f.nom for f in bientot_expire[:3])}")
        if cheques_sig > 0:
            lines.append(f"  URGENT — {cheques_sig} chèque(s) en attente de signature ({self._fmt(cheques_sig_montant)})")
        if cmd_attente > 0:
            lines.append(f"  INFO — {cmd_attente} commande(s) en attente validation direction")
        if chantiers_bloques > 0:
            lines.append(f"  URGENT — {chantiers_bloques} chantier(s) bloqué(s)")
        if not any([depasses, bientot_expire, cheques_sig, cmd_attente, chantiers_bloques]):
            lines.append("  Aucune alerte critique")
        lines += [
            "",
            "ACTIVITÉ:",
            f"  Chantiers en cours: {chantiers_en_cours} | Bloqués: {chantiers_bloques}",
            f"  Commandes en attente: {cmd_attente}",
            f"  Chèques à signer: {cheques_sig}",
            f"  Fournisseurs: {len(fournisseurs_all)} total",
        ]
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Main dispatcher
    # ------------------------------------------------------------------

    def get_data(self, modules):
        sections = []
        try:
            if 'general' in modules or not modules:
                sections.append(self._data_general())
            if 'caisse' in modules:
                sections.append(self._data_caisse())
            if 'banque' in modules:
                sections.append(self._data_banque())
            if 'charges_fixes' in modules:
                sections.append(self._data_charges_fixes())
            if 'charges_variables' in modules:
                sections.append(self._data_charges_variables())
            if 'commandes' in modules:
                sections.append(self._data_commandes())
            if 'fournisseurs' in modules:
                sections.append(self._data_fournisseurs())
            if 'cheques' in modules:
                sections.append(self._data_cheques())
            if 'salaires' in modules:
                sections.append(self._data_salaires())
            if 'chantiers' in modules:
                sections.append(self._data_chantiers())
            if 'previsions' in modules:
                sections.append(self._data_previsions())
            if 'vehicules' in modules:
                sections.append(self._data_vehicules())
        except Exception as e:
            sections.append(f"[Erreur collecte données: {str(e)}]")
        return "\n\n".join(sections)

    # ------------------------------------------------------------------
    # Prompt + Ollama call
    # ------------------------------------------------------------------

    def run(self, question, modules=None, username="utilisateur", history=""):
        if modules is None:
            modules = ['general']

        data = self.get_data(modules)
        today = timezone.now()

        # Smart truncation: cut at last complete line under 2500 chars
        if len(data) > 2500:
            truncated = data[:2500]
            last_nl = truncated.rfind('\n')
            data = (truncated[:last_nl] if last_nl > 1800 else truncated) + "\n  [données supplémentaires disponibles]"

        # History: keep last 600 chars, cut at line boundary
        if history and len(history) > 600:
            trimmed = history[-600:]
            nl = trimmed.find('\n')
            history = trimmed[nl:] if nl > 0 else trimmed

        prompt = f"""Tu es NEWIRIS AI, l'assistant de gestion de NEWIRIS (bâtiments intelligents, Tanger, Maroc).
Date: {today.strftime('%A %d %B %Y')} | Utilisateur: {username}

RÈGLES:
- Réponds UNIQUEMENT en français
- Utilise UNIQUEMENT les données fournies ci-dessous, n'invente rien
- Si une donnée est absente, dis-le clairement
- Formate les montants en DH (ex: 45,200 DH)
- Mets en avant les alertes et urgences
- Sois précis, professionnel et concis{chr(10) + "- Tiens compte de l'historique" if history else ""}
{f"{chr(10)}HISTORIQUE:{chr(10)}{history}{chr(10)}" if history else ""}
DONNÉES:
{data}

QUESTION: {question}

RÉPONSE:"""

        return self.call_ollama(prompt, temperature=0.25, max_tokens=500)