import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { AccesAdmin, AccesAdminService, CompteCree, RapportImport } from '../../../../core/services/acces-admin.service';
import { GroupeService } from '../../../../core/services/groupe.service';

/** Ce que contient le fichier du formulaire, avant import (lecture locale, rien n'est envoyé). */
interface ApercuFichier {
  groupe: string;
  membres: number;
  cotisations: number;
  sanctions: number;
  saison: string;
  responsable: string;
  logo: boolean;
}

/**
 * Configuration d'un groupe par l'administrateur : choisir le groupe, demander l'accès (le responsable décide),
 * puis charger le fichier du formulaire envoyé par le groupe. Aucune modification n'est possible sans l'accès
 * accordé par le responsable.
 */
@Component({
  selector: 'app-configuration-groupes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './configuration-groupes.component.html',
  styleUrl: './configuration-groupes.component.scss'
})
export class ConfigurationGroupesComponent implements OnInit {
  private api = inject(AccesAdminService);
  private groupes = inject(GroupeService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  loading = signal(true);
  working = signal(false);
  listeGroupes = signal<{ id: number; nom: string }[]>([]);
  acces = signal<AccesAdmin[]>([]);

  groupeId: number | null = null;
  message = '';

  fichier: unknown = null;
  nomFichier = '';
  apercu: ApercuFichier | null = null;
  erreurFichier = '';
  rapport = signal<RapportImport | null>(null);

  /** Comptes à créer pour les nouveaux membres (identifiant + mot de passe temporaire), et désignation du responsable. */
  creerComptes = true;
  creerResponsable = true;

  /** Le plus récent des accès de l'administrateur pour le groupe choisi. */
  accesCourant = computed(() => this.acces().find(a => a.groupeId === this.groupeId) ?? null);
  peutConfigurer = computed(() => !!this.accesCourant()?.actif);

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    forkJoin({ groupes: this.groupes.getAllGroupes(), acces: this.api.mesAcces() }).subscribe({
      next: r => {
        this.listeGroupes.set(
          (r.groupes as any[]).map(g => ({ id: g.id, nom: g.nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
        this.acces.set(r.acces);
        this.loading.set(false);
      },
      error: err => { this.loading.set(false); this.afficherErreur(err); }
    });
  }

  choisirGroupe(): void {
    this.rapport.set(null);
    this.fichier = null;
    this.apercu = null;
    this.nomFichier = '';
    this.erreurFichier = '';
  }

  rafraichir(): void {
    this.api.mesAcces().subscribe({ next: a => this.acces.set(a), error: err => this.afficherErreur(err) });
  }

  demander(): void {
    if (!this.groupeId) return;
    this.working.set(true);
    this.api.demander(this.groupeId, this.message.trim()).subscribe({
      next: () => {
        this.working.set(false);
        this.message = '';
        this.snackBar.open(this.translate.instant('accesAdmin.admin.requestSent'), this.translate.instant('accesAdmin.close'), { duration: 4000 });
        this.rafraichir();
      },
      error: err => { this.working.set(false); this.afficherErreur(err); }
    });
  }

  // ── Fichier du formulaire ───────────────────────────────
  lireFichier(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    this.rapport.set(null);
    this.fichier = null;
    this.apercu = null;
    this.erreurFichier = '';
    if (!fichier) return;
    this.nomFichier = fichier.name;
    if (fichier.size > 2_000_000) { this.erreurFichier = this.translate.instant('accesAdmin.admin.fileTooBig'); return; }

    const lecteur = new FileReader();
    lecteur.onload = () => {
      try {
        const contenu = JSON.parse(String(lecteur.result));
        const donnees = contenu?.donnees ?? contenu;
        if (!donnees || typeof donnees !== 'object') throw new Error('format');
        this.fichier = contenu;
        this.apercu = {
          groupe: donnees.groupe?.nom ?? '',
          membres: (donnees.membres ?? []).length,
          cotisations: (donnees.cotisations ?? []).length,
          sanctions: (donnees.sanctions ?? []).length,
          saison: donnees.saison?.libelle || donnees.saison?.debut || '',
          responsable: donnees.responsable?.nom ?? '',
          logo: !!donnees.groupe?.logo
        };
      } catch {
        this.erreurFichier = this.translate.instant('accesAdmin.admin.fileInvalid');
      }
    };
    lecteur.onerror = () => { this.erreurFichier = this.translate.instant('accesAdmin.admin.fileInvalid'); };
    lecteur.readAsText(fichier);
  }

  /** Le nom du groupe du fichier ne ressemble pas au groupe choisi : on prévient avant d'importer. */
  get groupeDifferent(): boolean {
    const choisi = this.listeGroupes().find(g => g.id === this.groupeId)?.nom?.toLowerCase().trim();
    const dansFichier = this.apercu?.groupe?.toLowerCase().trim();
    return !!choisi && !!dansFichier && choisi !== dansFichier;
  }

  simuler(): void { this.lancer(true); }
  importer(): void { this.lancer(false); }

  private lancer(simuler: boolean): void {
    if (!this.groupeId || !this.fichier) return;
    this.working.set(true);
    this.api.importer(this.groupeId, this.fichier, simuler, { creerComptes: this.creerComptes, creerResponsable: this.creerResponsable }).subscribe({
      next: r => {
        this.working.set(false);
        this.rapport.set(r);
        if (!simuler) this.snackBar.open(this.translate.instant('accesAdmin.admin.importDone'), this.translate.instant('accesAdmin.close'), { duration: 4000 });
      },
      error: err => { this.working.set(false); this.afficherErreur(err); }
    });
  }

  // ── Identifiants des comptes créés ──────────────────────
  /** Comptes créés avec un mot de passe à transmettre (les comptes existants n'en ont pas). */
  get comptesATransmettre(): CompteCree[] {
    return (this.rapport()?.comptes ?? []).filter(c => !!c.motDePasse);
  }

  private texteIdentifiants(c: CompteCree): string {
    return this.translate.instant('accesAdmin.admin.credentialsMessage', {
      prenom: c.prenom || c.nom, username: c.username, motDePasse: c.motDePasse, url: window.location.origin
    });
  }

  /** Lien WhatsApp avec le message d'identifiants, vers le numéro de la personne si on l'a. */
  lienWhatsApp(c: CompteCree): string {
    const numero = (c.tel || '').replace(/\D/g, '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(this.texteIdentifiants(c))}`;
  }

  /** CSV (séparateur « ; », ouvert directement par Excel) : à envoyer aux intéressés, puis à supprimer. */
  telechargerIdentifiants(): void {
    const lignes = [['Rôle', 'Nom', 'Prénom', 'Téléphone', 'E-mail', 'Identifiant', 'Mot de passe temporaire']]
      .concat(this.comptesATransmettre.map(c => [c.role, c.nom, c.prenom, c.tel, c.email, c.username, c.motDePasse ?? '']));
    const csv = '\uFEFF' + lignes.map(l => l.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'identifiants-' + (this.listeGroupes().find(g => g.id === this.groupeId)?.nom ?? 'groupe').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  copierIdentifiants(): void {
    const texte = this.comptesATransmettre.map(c => `${c.prenom} ${c.nom} : ${c.username} / ${c.motDePasse}`).join('\n');
    navigator.clipboard?.writeText(texte).then(
      () => this.snackBar.open(this.translate.instant('accesAdmin.admin.copied'), this.translate.instant('accesAdmin.close'), { duration: 3000 }),
      () => this.snackBar.open(this.translate.instant('accesAdmin.errorGeneric'), this.translate.instant('accesAdmin.close'), { duration: 3000 }));
  }

  private afficherErreur(err: any): void {
    const message = err?.error?.message ?? (typeof err?.error === 'string' ? err.error : this.translate.instant('accesAdmin.errorGeneric'));
    this.snackBar.open(message, this.translate.instant('accesAdmin.close'), { duration: 5000 });
  }
}
