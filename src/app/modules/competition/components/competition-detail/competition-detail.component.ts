// pages/competition-detail/competition-detail.component.ts
import { t as tr } from '../../../../core/i18n/traduire';
import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormGroup
} from '@angular/forms';
import {
  CompetitionDetailDTO, StatutCompetition, FormatCompetition
} from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { TabParticipantsComponent } from '../tab-participants/tab-participants.component';
import { TabPhasesComponent }       from '../tab-phases/tab-phases.component';
import { TabResumeComponent }       from '../tab-resume/tab-resume.component';
import { TabStatistiquesComponent } from '../tab-statistiques/tab-statistiques.component';
import { TabTirageComponent }       from '../../component/tab-tirage/tab-tirage.component';
import { TabAwardsComponent }       from '../tab-awards/tab-awards.component';
import { TabAccesComponent }        from '../tab-acces/tab-acces.component';
import { OfficielsComponent }       from '../officiels/officiels.component';
import { TabLicencesComponent } from '../tab-licences/tab-licences.component';
import { CompetitionRecompensesSanctionsComponent } from '../competition-recompenses-sanctions/competition-recompenses-sanctions.component';
import { PalmaresBannerComponent } from '../palmares-banner/palmares-banner.component';

type Tab = 'resume' | 'participants' | 'tirage' | 'phases' | 'licences' |
           'statistiques' | 'awards' | 'officiels' | 'acces' | 'config';

type RoleCompetition =
  'RESPONSABLE' | 'SECRETAIRE' | 'ARBITRE' | 'MEDECIN' |
  'KINESITHERAPEUTE' | 'COMMISSAIRE' | 'DELEGUE' | 'OBSERVATEUR';

interface MonAccesDTO {
  role:        string;
  permissions: string[];
}

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    TabResumeComponent, TabParticipantsComponent,
    TabPhasesComponent, TabStatistiquesComponent,
    TabTirageComponent, TabAwardsComponent,
    TabAccesComponent, OfficielsComponent,
    TranslateModule, MatIconModule, TabLicencesComponent, CompetitionRecompensesSanctionsComponent,
    PalmaresBannerComponent
  ],
  templateUrl: './competition-detail.component.html',
  styleUrls:   ['./competition-detail.component.scss']
})
export class CompetitionDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private api   = inject(CompetitionApiService);
  private fb    = inject(FormBuilder);
  rapportEnCours = signal(false);

  /** Télécharge le rapport PDF (synthèse, podium, récompenses, classement, résultats, statistiques, discipline). */
  telechargerRapport(langue: 'fr' | 'en'): void {
    const c = this.competition();
    if (!c || this.rapportEnCours()) return;
    this.rapportEnCours.set(true);
    this.api.rapportCompetitionPdf(c.id, langue).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${langue === 'en' ? 'competition-report' : 'rapport-competition'}-${c.nom}.pdf`;
        a.click(); URL.revokeObjectURL(url);
        this.rapportEnCours.set(false);
      },
      error: () => this.rapportEnCours.set(false)
    });
  }

  // ── State ──────────────────────────────────────────────────
  competition    = signal<CompetitionDetailDTO | null>(null);
  activeTab      = signal<Tab>('resume');
  drawerOpen     = signal(false);
  showStatutMenu = signal(false);
  saving         = signal(false);
  confirmModal   = signal<{
    titre: string; message: string;
    iconName: string; icon: string; action: () => void;
  } | null>(null);

  // ── Accès & permissions ───────────────────────────────────
  currentUserRole = signal<RoleCompetition | null>(null);
  monAcces        = signal<MonAccesDTO | null>(null);
  isAdminMyApp    = false;

  // ── Computed permissions ──────────────────────────────────
  canSaisirScores      = computed(() => this.hp('SAISIR_SCORES'));
  canGererCompositions = computed(() => this.hp('GERER_COMPOSITIONS'));
  canValiderFeuilles   = computed(() => this.hp('VALIDER_FEUILLES'));
  canFichesMedicales   = computed(() => this.hp('FICHES_MEDICALES'));
  canGererOfficiels    = computed(() => this.hp('GERER_OFFICIELS'));
  canPlanifierMatchs   = computed(() => this.hp('PLANIFIER_MATCHS'));
  canGererPhases       = computed(() => this.hp('GERER_PHASES'));
  canAttribuerAwards   = computed(() => this.hp('ATTRIBUER_AWARDS'));
  canGererStaff        = computed(() => this.hp('GERER_STAFF'));
  canModifierConfig    = computed(() => this.hp('MODIFIER_CONFIG'));
  /** Récompenses, barème et sanctions : réservés au responsable de la compétition (le serveur l'impose aussi). */
  estOrganisateur      = computed(() => this.monAcces()?.role === 'RESPONSABLE');

  private hp(perm: string): boolean {
    if (this.isAdminMyApp) return true;
    return this.monAcces()?.permissions?.includes(perm) ?? false;
  }

  editForm?: FormGroup;

  tabs = [
    { key: 'resume'       as Tab, label: 'Résumé',      icon: 'dashboard'            },
    { key: 'participants' as Tab, label: 'Équipes',      icon: 'groups'               },
    { key: 'phases'       as Tab, label: 'Phases',       icon: 'format_list_bulleted' },
    { key: 'statistiques' as Tab, label: 'Statistiques', icon: 'bar_chart'            },
  ];

  get competitionId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  // ── Format helpers ────────────────────────────────────────
  isFormatCoupe(): boolean {
    const f = this.competition()?.config?.format;
    return f === FormatCompetition.ELIMINATION_SIMPLE || f === 'ELIMINATION_SIMPLE' as any;
  }

  isFormatMixte(): boolean {
    const f = this.competition()?.config?.format;
    return f === FormatCompetition.MIXTE || f === 'MIXTE' as any;
  }

  isFormatChampionnat(): boolean {
    const f = this.competition()?.config?.format;
    return f === FormatCompetition.ALLER_RETOUR || f === FormatCompetition.ALLER_SIMPLE
      || f === 'ALLER_RETOUR' as any || f === 'ALLER_SIMPLE' as any;
  }

  avecKnockout(): boolean {
    // Coupe ou Mixte → phases à élimination → prolongations activables
    return this.isFormatCoupe() || this.isFormatMixte();
  }

  // ── Init ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.reload();
    this.chargerMonRole();
  }

  reload(): void {
    this.api.getById(this.competitionId).subscribe(c => {
      this.competition.set(c);
      this.buildForm(c);
    });
  }

  // ── Charger le rôle + permissions depuis le backend ───────
  private chargerMonRole(): void {
    this.api.getMonRole(this.competitionId).subscribe({
      next: (r: any) => {
        this.currentUserRole.set((r.role as RoleCompetition) || null);
        this.monAcces.set({
          role:        r.role ?? '',
          permissions: r.permissions ?? []
        });
        this.isAdminMyApp = r.role === 'ADMIN' || r.isAdmin === true;
      },
      error: () => {
        this.currentUserRole.set(null);
        this.monAcces.set(null);
      }
    });
  }

  // ── Helpers rôle ─────────────────────────────────────────
  isResponsable(): boolean {
    return this.isAdminMyApp || this.currentUserRole() === 'RESPONSABLE';
  }

  canEdit(): boolean {
    return this.isAdminMyApp
      || this.canModifierConfig()
      || this.canSaisirScores();
  }

  // ── Statuts ───────────────────────────────────────────────
  transitionsDisponibles(): { statut: StatutCompetition; label: string }[] {
    if (!this.canModifierConfig() && !this.isResponsable()) return [];
    const s = this.competition()?.statut;
    switch (s) {
      case StatutCompetition.BROUILLON:
        return [{ statut: StatutCompetition.INSCRIPTION_OUVERTE,
                  label: tr('ui.ts_ouvrir_les_inscriptions_b95d') }];
      case StatutCompetition.INSCRIPTION_OUVERTE:
        return [{ statut: StatutCompetition.BROUILLON,
                  label: 'Repasser en brouillon' }];
      case StatutCompetition.EN_COURS:
        return [
          { statut: StatutCompetition.TERMINE, label: tr('ui.ts_marquer_comme_terminee_a13e') },
          { statut: StatutCompetition.ANNULE,  label: tr('ui.annuler_la_competition_9b21') },
        ];
      default:
        return [];
    }
  }

  canModifier():          boolean { return this.competition()?.statut !== StatutCompetition.ANNULE && this.canModifierConfig(); }
  canChangerStatut():     boolean { return this.transitionsDisponibles().length > 0; }
  canLancer():            boolean { return this.competition()?.statut === StatutCompetition.INSCRIPTION_OUVERTE && this.canGererPhases(); }
  canPhaseSuivante():     boolean { return this.competition()?.statut === StatutCompetition.EN_COURS && this.competition()?.config?.format === FormatCompetition.MIXTE && this.canGererPhases(); }
  canTerminer():          boolean { return this.competition()?.statut === StatutCompetition.EN_COURS && this.isResponsable(); }
  canAnnuler():           boolean { return [StatutCompetition.BROUILLON, StatutCompetition.INSCRIPTION_OUVERTE].includes(this.competition()?.statut as StatutCompetition) && this.isResponsable(); }
  isBrouillon():          boolean { return this.competition()?.statut === StatutCompetition.BROUILLON; }
  isInscriptionOuverte(): boolean { return this.competition()?.statut === StatutCompetition.INSCRIPTION_OUVERTE; }
  isEnCours():            boolean { return this.competition()?.statut === StatutCompetition.EN_COURS; }
  isTermine():            boolean { return this.competition()?.statut === StatutCompetition.TERMINE; }
  isAnnule():             boolean { return this.competition()?.statut === StatutCompetition.ANNULE; }

  isDateLimiteProche(): boolean {
    const d = this.competition()?.dateLimiteInscription;
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  }

  // ── Drawer ────────────────────────────────────────────────
  openDrawer(): void {
    this.buildForm(this.competition()!);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void { this.drawerOpen.set(false); }

  buildForm(c: CompetitionDetailDTO): void {
    const cfg = c.config;
    this.editForm = this.fb.group({
      // ── Infos générales (toujours éditables) ──────────────
      nom:                   [c.nom],
      description:           [c.description ?? ''],
      organisateurNom:       [c.organisateurNom ?? ''],
      logoUrl:               [c.logoUrl ?? ''],
      // ── Visibilité (toujours éditable) ────────────────────
      publique:              [c.publique ?? true],
      // ── Dates (toujours éditables) ────────────────────────
      dateDebut:             [c.dateDebut ?? ''],
      dateFin:               [c.dateFin ?? ''],
      dateLimiteInscription: [c.dateLimiteInscription ?? ''],
      // ── Configuration (BROUILLON seulement) ───────────────
      config: this.fb.group({
        // Équipes
        nombreEquipesMin:               [cfg?.nombreEquipesMin ?? 4],
        nombreEquipesMax:               [cfg?.nombreEquipesMax ?? 16],
        // Points
        pointsVictoire:                 [cfg?.pointsVictoire ?? 3],
        pointsNul:                      [cfg?.pointsNul ?? 1],
        pointsDefaite:                  [cfg?.pointsDefaite ?? 0],
        // Forfait
        scoreForfaitVainqueur:          [cfg?.scoreForfaitVainqueur ?? 3],
        scoreForfaitPerdant:            [cfg?.scoreForfaitPerdant ?? 0],
        // Droits d'engagement
        droitsEngagementActifs:         [cfg?.droitsEngagementActifs ?? false],
        montantEngagement:              [cfg?.montantEngagement ?? null],
        // Suspensions / Cartons
        seuilCartonsJaunesSuspension:   [cfg?.seuilCartonsJaunesSuspension ?? 3],
        matchsSuspensionCartonRouge:    [cfg?.matchsSuspensionCartonRouge ?? 1],
        cumulCartonsEntrePhases:        [cfg?.cumulCartonsEntrePhases ?? false],
        dureeMiTemps:                   [cfg?.dureeMiTemps ?? 45],
        // Prolongations (knockout)
        prolongationsActives:           [cfg?.prolongationsActives ?? true],
        dureeProlong1:                  [cfg?.dureeProlong1 ?? 15],
        dureeProlong2:                  [cfg?.dureeProlong2 ?? 15],
        tabActif:                       [cfg?.tabActif ?? true],
        avecMatch3ePlace:               [cfg?.avecMatch3ePlace ?? true],
        // Championnat
        allerRetour:                    [cfg?.allerRetour ?? true],
        allerRetourGroupes:             [cfg?.allerRetourGroupes ?? false],
        coupeAllerRetour:               [cfg?.coupeAllerRetour ?? false],
        // Config Mixte (groupes)
        nombreGroupes:                  [cfg?.nombreGroupes ?? 4],
        equipesParGroupe:               [cfg?.equipesParGroupe ?? 4],
        qualifiesParGroupe:             [cfg?.qualifiesParGroupe ?? 2],
        meilleursTimesActif:            [cfg?.meilleursTimesActif ?? false],
        nombreMeilleursTimesQualifies:  [cfg?.nombreMeilleursTimesQualifies ?? 0],
        // Planning
        heureDefautMatch:               [cfg?.heureDefautMatch ?? '15:00'],
        intervalleJournees:             [cfg?.intervalleJournees ?? 7],
        delaiMinEntreMatchs:            [cfg?.delaiMinEntreMatchs ?? 3],
        effectifMin:                    [cfg?.effectifMin ?? null],
        dateLimiteEffectif:             [cfg?.dateLimiteEffectif ?? ''],
        matchsParJournee:               [cfg?.matchsParJournee ?? null],
        // Licences
        licencesActivees:               [cfg?.licencesActivees ?? false],
        licencesGratuites:              [cfg?.licencesGratuites ?? 0],
        montantLicenceSup:              [cfg?.montantLicenceSup ?? null],
        blocageFeuilleSansLicence:      [cfg?.blocageFeuilleSansLicence ?? true],
        photoNumerique:                 [cfg?.photoNumerique ?? true],
        dateFinValiditeLicences:        [cfg?.dateFinValiditeLicences ?? ''],
      })
    });
  }

  sauvegarder(): void {
    if (!this.editForm || this.editForm.invalid) return;
    this.saving.set(true);
    const v = this.editForm.value;

    const payload: any = {
      nom:                   v.nom,
      description:           v.description   || undefined,
      organisateurNom:       v.organisateurNom || undefined,
      logoUrl:               v.logoUrl        || undefined,
      publique:              v.publique,          // toujours envoyé
      dateDebut:             v.dateDebut      || undefined,
      dateFin:               v.dateFin        || undefined,
      dateLimiteInscription: v.dateLimiteInscription || undefined,
    };

    if (this.isBrouillon()) {
      const cfg = v.config;
      payload.config = {
        // Équipes
        nombreEquipesMin:               cfg.nombreEquipesMin,
        nombreEquipesMax:               cfg.nombreEquipesMax,
        // Points
        pointsVictoire:                 cfg.pointsVictoire,
        pointsNul:                      cfg.pointsNul,
        pointsDefaite:                  cfg.pointsDefaite,
        // Forfait
        scoreForfaitVainqueur:          cfg.scoreForfaitVainqueur,
        scoreForfaitPerdant:            cfg.scoreForfaitPerdant,
        // Droits d'engagement
        droitsEngagementActifs:         cfg.droitsEngagementActifs,
        montantEngagement:              cfg.droitsEngagementActifs ? cfg.montantEngagement : null,
        // Suspensions
        seuilCartonsJaunesSuspension:   cfg.seuilCartonsJaunesSuspension,
        matchsSuspensionCartonRouge:    cfg.matchsSuspensionCartonRouge,
        cumulCartonsEntrePhases:        cfg.cumulCartonsEntrePhases,
        dureeMiTemps:                   cfg.dureeMiTemps ?? 45,
        // Prolongations
        prolongationsActives:           cfg.prolongationsActives,
        dureeProlong1:                  cfg.dureeProlong1,
        dureeProlong2:                  cfg.dureeProlong2,
        tabActif:                       cfg.tabActif,
        avecMatch3ePlace:               cfg.avecMatch3ePlace,
        // Championnat
        allerRetour:                    cfg.allerRetour,
        allerRetourGroupes:             cfg.allerRetourGroupes,
        coupeAllerRetour:               cfg.coupeAllerRetour,
        // Mixte
        nombreGroupes:                  cfg.nombreGroupes,
        equipesParGroupe:               cfg.equipesParGroupe,
        qualifiesParGroupe:             cfg.qualifiesParGroupe,
        meilleursTimesActif:            cfg.meilleursTimesActif,
        nombreMeilleursTimesQualifies:  cfg.meilleursTimesActif ? cfg.nombreMeilleursTimesQualifies : 0,
        // Planning
        heureDefautMatch:               cfg.heureDefautMatch,
        intervalleJournees:             cfg.intervalleJournees,
        delaiMinEntreMatchs:            cfg.delaiMinEntreMatchs,
        effectifMin:                    cfg.effectifMin || null,
        dateLimiteEffectif:             cfg.dateLimiteEffectif || null,
        matchsParJournee:               cfg.matchsParJournee || null,
        // Licences
        licencesActivees:               cfg.licencesActivees,
        licencesGratuites:              cfg.licencesActivees ? cfg.licencesGratuites : 0,
        montantLicenceSup:              cfg.licencesActivees ? (cfg.montantLicenceSup || null) : null,
        blocageFeuilleSansLicence:      cfg.blocageFeuilleSansLicence,
        photoNumerique:                 cfg.photoNumerique,
        dateFinValiditeLicences:        cfg.dateFinValiditeLicences || null,
      };
    }

    this.api.modifier(this.competition()!.id, payload).subscribe({
      next: () => { this.reload(); this.closeDrawer(); this.saving.set(false); },
      error: () => this.saving.set(false)
    });
  }

  // ── Navigation ────────────────────────────────────────────
  setTab(t: Tab): void { this.activeTab.set(t); }

  ouvrirTirage(): void { this.activeTab.set('tirage'); }

  onTirageLaunched(): void {
    this.reload();
    this.activeTab.set('phases');
  }

  // ── Statut ────────────────────────────────────────────────
  toggleStatutMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showStatutMenu.update(v => !v);
  }

  changerStatut(statut: StatutCompetition, event: MouseEvent): void {
    event.stopPropagation();
    this.showStatutMenu.set(false);
    const id = this.competition()!.id;
    switch (statut) {
      case StatutCompetition.INSCRIPTION_OUVERTE:
        this.api.ouvrirInscriptions(id).subscribe({ next: () => this.reload() });
        break;
      case StatutCompetition.BROUILLON:
        this.api.fermerInscriptions(id).subscribe({ next: () => this.reload() });
        break;
      case StatutCompetition.TERMINE:
        this.confirmerTerminer();
        break;
      case StatutCompetition.ANNULE:
        this.confirmerAnnuler();
        break;
    }
  }

  lancer(): void {
    this.confirmModal.set({
      titre: 'Lancer la compétition',
      message: tr('ui.ts_une_fois_lancee_les_inscriptions_5131'),
      iconName: 'play_arrow', icon: 'icon-success',
      action: () => {
        this.api.lancer(this.competition()!.id).subscribe({
          next: () => { this.reload(); this.confirmModal.set(null); },
          error: err => {
            const msg = err.error?.message || 'Une erreur imprévue est survenue.';
            this.confirmModal.update(c => c ? {
              ...c, titre: 'Lancement impossible',
              message: msg, icon: 'icon-danger', iconName: 'report_problem'
            } : null);
          }
        });
      }
    });
  }

  /** Phase finale (format mixte) : le tirage se valide dans l'onglet Phases (propositions + modification manuelle). */
  allerAuxPhases(): void { this.setTab('phases'); }

  phaseSuivante(): void {
    this.confirmModal.set({
      titre: 'Passer à la phase suivante',
      message: tr('ui.ts_tous_les_matchs_de_la_phase_de_g_9f9e'),
      iconName: 'skip_next', icon: 'icon-warning',
      action: () => {
        this.api.phaseSuivante(this.competition()!.id).subscribe(() => {
          this.reload(); this.confirmModal.set(null);
        });
      }
    });
  }

  confirmerTerminer(): void {
    this.confirmModal.set({
      titre: 'Terminer la compétition',
      message: tr('ui.ts_la_competition_sera_marquee_comm_d201'),
      iconName: 'flag', icon: 'icon-warning',
      action: () => {
        this.api.terminer(this.competition()!.id).subscribe(() => {
          this.reload(); this.confirmModal.set(null);
        });
      }
    });
  }

  confirmerAnnuler(): void {
    this.showStatutMenu.set(false);
    this.confirmModal.set({
      titre: 'Annuler la compétition',
      message: tr('ui.ts_la_competition_sera_annulee_defi_432e'),
      iconName: 'cancel', icon: 'icon-danger',
      action: () => {
        this.api.annuler(this.competition()!.id).subscribe(() => {
          this.reload(); this.confirmModal.set(null); this.closeDrawer();
        });
      }
    });
  }

  // ── Labels ────────────────────────────────────────────────
  typeLabel(t: string): string {
    const m: Record<string, string> = {
      CHAMPIONNAT: 'competition.types.championnat', COUPE: 'competition.types.coupe', MIXTE: 'competition.types.mixte'
    };
    return m[t] ? tr(m[t]) : t;
  }

  statutLabel(s: StatutCompetition): string {
    const m: Record<StatutCompetition, string> = {
      [StatutCompetition.BROUILLON]:           'competition.statuts.brouillon',
      [StatutCompetition.INSCRIPTION_OUVERTE]: 'competition.statuts.inscriptionsOuvertes',
      [StatutCompetition.EN_COURS]:            'competition.statuts.enCours',
      [StatutCompetition.TERMINE]:             'competition.statuts.termine',
      [StatutCompetition.ANNULE]:              'competition.statuts.annule',
    };
    return m[s] ? tr(m[s]) : s;
  }
}