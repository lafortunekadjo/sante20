// pages/competition-detail/competition-detail.component.ts
import {
  Component, OnInit, inject, signal, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormGroup
} from '@angular/forms';
import { CompetitionDetailDTO, StatutCompetition, FormatCompetition } from '../../../../core/models/competition.models';
import { CompetitionApiService } from '../../../../core/services/competition/competition-api.service';
import { TabParticipantsComponent } from '../tab-participants/tab-participants.component';
import { TabPhasesComponent } from '../tab-phases/tab-phases.component';
import { TabResumeComponent } from '../tab-resume/tab-resume.component';
import { TabStatistiquesComponent } from '../tab-statistiques/tab-statistiques.component';
import { TabTirageComponent } from '../../component/tab-tirage/tab-tirage.component';


type Tab = 'resume' | 'participants' |'tirage' | 'phases' | 'statistiques';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    TabResumeComponent, TabParticipantsComponent,
    TabPhasesComponent, TabStatistiquesComponent,TabTirageComponent,
  ],
  templateUrl: './competition-detail.component.html',
  styleUrls: ['./competition-detail.component.scss']
})
export class CompetitionDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private api   = inject(CompetitionApiService);
  private fb    = inject(FormBuilder);

  competition   = signal<CompetitionDetailDTO | null>(null);
  activeTab     = signal<Tab>('resume');
  drawerOpen    = signal(false);
  showStatutMenu = signal(false);
  saving        = signal(false);
  confirmModal  = signal<{
    titre: string;
    message: string;
    iconName: string;
    icon: string;
    action: () => void;
  } | null>(null);

  editForm?: FormGroup;

  tabs = [
    { key: 'resume'       as Tab, label: 'Résumé',      icon: 'dashboard' },
    { key: 'participants' as Tab, label: 'Équipes',      icon: 'groups' },
    { key: 'phases'       as Tab, label: 'Phases',       icon: 'format_list_bulleted' },
    { key: 'statistiques' as Tab, label: 'Statistiques', icon: 'bar_chart' },
  ];

  // ── Transitions de statut autorisées
  transitionsDisponibles(): { statut: StatutCompetition; label: string }[] {
    const s = this.competition()?.statut;
    switch (s) {
      case StatutCompetition.BROUILLON:
        return [{ statut: StatutCompetition.INSCRIPTION_OUVERTE,
                  label: 'Ouvrir les inscriptions' }];
      case StatutCompetition.INSCRIPTION_OUVERTE:
        return [
          { statut: StatutCompetition.BROUILLON,
            label: 'Repasser en brouillon' },
        ];
      case StatutCompetition.EN_COURS:
        return [
          { statut: StatutCompetition.TERMINE,
            label: 'Marquer comme terminée' },
          { statut: StatutCompetition.ANNULE,
            label: 'Annuler la compétition' },
        ];
      default:
        return [];
    }
  }

  onTirageLaunched(): void {
  // Recharger la compétition depuis l'API
  this.reload();
  // Basculer sur l'onglet phases
  this.activeTab.set('phases');
}

  // ── Guards
  canModifier():       boolean { return this.competition()?.statut !== StatutCompetition.ANNULE; }
  canChangerStatut():  boolean { return this.transitionsDisponibles().length > 0; }
  canLancer():         boolean { return this.competition()?.statut === StatutCompetition.INSCRIPTION_OUVERTE; }
  canPhaseSuivante():  boolean {
    return this.competition()?.statut === StatutCompetition.EN_COURS
        && this.competition()?.config?.format === FormatCompetition.MIXTE;
  }
  canTerminer():       boolean { return this.competition()?.statut === StatutCompetition.EN_COURS; }
  canAnnuler():        boolean {
    return [StatutCompetition.BROUILLON,
            StatutCompetition.INSCRIPTION_OUVERTE].includes(
      this.competition()?.statut as StatutCompetition);
  }
  isBrouillon():       boolean { return this.competition()?.statut === StatutCompetition.BROUILLON; }
  isInscriptionOuverte(): boolean { return this.competition()?.statut === StatutCompetition.INSCRIPTION_OUVERTE; }
  isEnCours():         boolean { return this.competition()?.statut === StatutCompetition.EN_COURS; }
  isTermine():         boolean { return this.competition()?.statut === StatutCompetition.TERMINE; }
  isAnnule():          boolean { return this.competition()?.statut === StatutCompetition.ANNULE; }

  isDateLimiteProche(): boolean {
    const d = this.competition()?.dateLimiteInscription;
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 jours
  }

  ngOnInit(): void { this.reload(); }

  reload(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe(c => {
      this.competition.set(c);
      this.buildForm(c);
    });
  }

//   @HostListener('document:click', ['$event'])
// onDocumentClick(event: MouseEvent): void {
//   const target = event.target as HTMLElement;
//   if (!target.closest('.statut-selector')) {
//     this.showStatutMenu.set(false);
//   }
// }

  // ── Drawer
  openDrawer(): void {
    this.buildForm(this.competition()!);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  buildForm(c: CompetitionDetailDTO): void {
    this.editForm = this.fb.group({
      nom:                   [c.nom],
      description:           [c.description ?? ''],
      organisateurNom:       [c.organisateurNom ?? ''],
      logoUrl:               [c.logoUrl ?? ''],
      dateDebut:             [c.dateDebut ?? ''],
      dateFin:               [c.dateFin ?? ''],
      dateLimiteInscription: [c.dateLimiteInscription ?? ''],
      config: this.fb.group({
        nombreEquipesMin:             [c.config?.nombreEquipesMin ?? 4],
        nombreEquipesMax:             [c.config?.nombreEquipesMax ?? 16],
        montantEngagement:            [c.config?.montantEngagement ?? null],
        droitsEngagementActifs:       [c.config?.droitsEngagementActifs ?? false],
        seuilCartonsJaunesSuspension: [c.config?.seuilCartonsJaunesSuspension ?? 3],
        matchsSuspensionCartonRouge:  [c.config?.matchsSuspensionCartonRouge ?? 1],
      })
    });
  }

  ouvrirTirage(): void {
  this.activeTab.set('tirage');
}

  sauvegarder(): void {
    if (!this.editForm || this.editForm.invalid) return;
    this.saving.set(true);
    const v = this.editForm.value;

    // Construire le payload selon le statut
    const payload: any = {
      nom:                   v.nom,
      description:           v.description || undefined,
      organisateurNom:       v.organisateurNom || undefined,
      logoUrl:               v.logoUrl || undefined,
      dateDebut:             v.dateDebut || undefined,
      dateFin:               v.dateFin || undefined,
      dateLimiteInscription: v.dateLimiteInscription || undefined,
    };

    // Config seulement si brouillon
    if (this.isBrouillon()) {
      payload.config = {
        nombreEquipesMin:             v.config.nombreEquipesMin,
        nombreEquipesMax:             v.config.nombreEquipesMax,
        montantEngagement:            v.config.montantEngagement,
        droitsEngagementActifs:       !!v.config.montantEngagement,
        seuilCartonsJaunesSuspension: v.config.seuilCartonsJaunesSuspension,
        matchsSuspensionCartonRouge:  v.config.matchsSuspensionCartonRouge,
      };
    }

    this.api.modifier(this.competition()!.id, payload).subscribe({
      next: () => {
        this.reload();
        this.closeDrawer();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Changement de statut
 toggleStatutMenu(event: MouseEvent): void {
  event.stopPropagation(); // Empêche le HostListener de fermer le menu aussitôt
  console.log('Toggle Menu cliqué'); 
  this.showStatutMenu.update(v => !v);
}

 // ── Corriger changerStatut
changerStatut(statut: StatutCompetition, event: MouseEvent): void {
  event.stopPropagation();
  console.log(statut)
  this.showStatutMenu.set(false); // Ferme le menu immédiatement
  const id = this.competition()!.id;

  switch (statut) {
    
    case StatutCompetition.INSCRIPTION_OUVERTE:
      console.log(statut)
      // Appelle l'API pour ouvrir les inscriptions
      this.api.ouvrirInscriptions(id).subscribe({
        next: () => this.reload(), // Recharge les données pour mettre à jour l'UI
        error: (e) => console.error('Erreur lors de l\'ouverture des inscriptions', e)
      });
      break;

    case StatutCompetition.BROUILLON:
      console.log(statut)
      // Appelle l'API pour repasser en brouillon (fermer inscriptions)
      this.api.fermerInscriptions(id).subscribe({
        next: () => this.reload(),
        error: (e) => console.error('Erreur lors du retour en brouillon', e)
      });
      break;

    case StatutCompetition.TERMINE:
      this.confirmerTerminer(); // Ouvre la modal de confirmation existante
      break;

    case StatutCompetition.ANNULE:
      this.confirmerAnnuler(); // Ouvre la modal de confirmation existante
      break;
  }
}

  // ── Actions avec confirmation
lancer(): void {
  this.confirmModal.set({
    titre:    'Lancer la compétition',
    message:  'Une fois lancée, les inscriptions seront fermées et le calendrier sera généré automatiquement.',
    iconName: 'play_arrow',
    icon:     'icon-success',
    action:   () => {
      this.api.lancer(this.competition()!.id).subscribe({
        next: () => {
          this.reload();
          this.confirmModal.set(null);
        },
        error: (err) => {
          // 1. Extraction du message de la BusinessException
          // Spring Boot place le message d'exception dans la propriété 'message' du corps de la réponse
          const messageErreur = err.error?.message || "Une erreur imprévue est survenue.";

          // 2. Mise à jour de la modal pour afficher l'erreur au lieu de la fermer
          this.confirmModal.update(current => current ? {
            ...current,
            titre: 'Lancement impossible',
            message: messageErreur, // Affichera : "Pas assez d'équipes inscrites (min: 4)"
            icon: 'icon-danger',
            iconName: 'report_problem'
          } : null);

          console.error('Erreur métier capturée :', messageErreur);
        }
      });
    }
  });
}
  phaseSuivante(): void {
    this.confirmModal.set({
      titre:    'Passer à la phase suivante',
      message:  'Tous les matchs de la phase de groupes seront clôturés '
              + 'et le bracket de la phase finale sera généré.',
      iconName: 'skip_next',
      icon:     'icon-warning',
      action:   () => {
        this.api.phaseSuivante(this.competition()!.id).subscribe(() => {
          this.reload();
          this.confirmModal.set(null);
        });
      }
    });
  }

  confirmerTerminer(): void {
    this.confirmModal.set({
      titre:    'Terminer la compétition',
      message:  'La compétition sera marquée comme terminée. '
              + 'Aucune modification ne sera possible ensuite.',
      iconName: 'flag',
      icon:     'icon-warning',
      action:   () => {
        this.api.terminer(this.competition()!.id).subscribe(() => {
          this.reload();
          this.confirmModal.set(null);
        });
      }
    });
  }

  confirmerAnnuler(): void {
    this.showStatutMenu.set(false);
    this.confirmModal.set({
      titre:    'Annuler la compétition',
      message:  'La compétition sera annulée définitivement. '
              + 'Cette action est irréversible.',
      iconName: 'cancel',
      icon:     'icon-danger',
      action:   () => {
        this.api.annuler(this.competition()!.id).subscribe(() => {
          this.reload();
          this.confirmModal.set(null);
          this.closeDrawer();
        });
      }
    });
  }

  setTab(t: Tab): void { this.activeTab.set(t); }

  typeLabel(t: string): string {
    const m: Record<string, string> = {
      CHAMPIONNAT: 'Championnat', COUPE: 'Coupe', MIXTE: 'Mixte'
    };
    return m[t] ?? t;
  }

  statutLabel(s: StatutCompetition): string {
    const m: Record<StatutCompetition, string> = {
      [StatutCompetition.BROUILLON]:           'Brouillon',
      [StatutCompetition.INSCRIPTION_OUVERTE]: 'Inscriptions ouvertes',
      [StatutCompetition.EN_COURS]:            'En cours',
      [StatutCompetition.TERMINE]:             'Terminée',
      [StatutCompetition.ANNULE]:              'Annulée',
    };
    return m[s] ?? s;
  }
}



