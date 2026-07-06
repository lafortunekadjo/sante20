// excel-import.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, mergeMap, catchError, of, forkJoin, lastValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { Membre } from '../models/membre.model';
import { User } from '../models/user';
import { MembreService } from './membre.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { Equipe } from '../models/groupe.model copy';
import { GeneralService } from './general.service';

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  successMembers: Membre[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data: any;
}

export interface ExcelRowData {
  nom?: string;
  prenom?: string;
  sexe?: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  poste?: string;
  equipe?: string;
  assurance?: string | boolean;
  cotisationPayee?: string | boolean;
  active?: string | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelImportService {

  constructor(
    private membreService: MembreService,
    private userService: UserService,
    private authService: AuthService,
    private equipeService: GeneralService
  ) {}

 

  /**
   * Lire et parser un fichier Excel
   */
  parseExcelFile(file: File): Observable<ExcelRowData[]> {
    return from(this.readExcelFile(file)).pipe(
      map(data => this.validateAndCleanData(data))
    );
  }

  /**
   * Importer les membres depuis les données Excel
   */
  importMembers(excelData: ExcelRowData[], equipes: any[] = []): Observable<ImportResult> {
    const result: ImportResult = {
      totalRows: excelData.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      successMembers: []
    };

    // Validation préalable de toutes les lignes
    const validatedData = this.validateAllRows(excelData, equipes);
    result.errors = validatedData.errors;

    if (validatedData.validRows.length === 0) {
      result.errorCount = result.totalRows;
      return of(result);
    }

    // Traitement des lignes valides
    return this.processValidRows(validatedData.validRows).pipe(
      map(processResults => {
        result.successCount = processResults.filter(r => r.success).length;
        result.errorCount = result.totalRows - result.successCount;
        
        // Ajouter les erreurs de traitement
        processResults.forEach((res, index) => {
          if (!res.success) {
            result.errors.push({
              row: validatedData.validRows[index].rowIndex,
              message: res.error || 'Erreur lors de la création',
              data: validatedData.validRows[index].data
            });
          } else {
            result.successMembers.push(res.member!);
          }
        });

        return result;
      }),
      catchError(error => {
        console.error('Erreur globale lors de l\'importation:', error);
        result.errorCount = result.totalRows;
        result.errors.push({
          row: 0,
          message: 'Erreur système lors de l\'importation',
          data: {}
        });
        return of(result);
      })
    );
  }

  /**
   * Générer un template Excel pour l'importation
   */
  generateTemplate(): void {
    const templateData = [
      {
        'Nom*': 'Dupont',
        'Prénom*': 'Jean',
        'Sexe*': 'masculin',
        'Email': 'jean.dupont@email.com',
        'Téléphone': '0123456789',
        'Date de naissance': '1990-01-15',
        'Poste': 'Attaquant',
        'Équipe': 'Équipe A',
        'Assurance': 'oui',
        'Cotisation payée': 'non',
        'Actif': 'oui'
      },
      {
        'Nom*': 'Martin',
        'Prénom*': 'Marie',
        'Sexe*': 'feminin',
        'Email': 'marie.martin@email.com',
        'Téléphone': '0987654321',
        'Date de naissance': '1985-06-20',
        'Poste': 'Milieu',
        'Équipe': '',
        'Assurance': 'oui',
        'Cotisation payée': 'oui',
        'Actif': 'oui'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Membres');

    // Ajouter des styles et commentaires si possible
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Élargir les colonnes
    ws['!cols'] = [
      { width: 15 }, // Nom
      { width: 15 }, // Prénom
      { width: 12 }, // Sexe
      { width: 25 }, // Email
      { width: 15 }, // Téléphone
      { width: 18 }, // Date de naissance
      { width: 15 }, // Poste
      { width: 15 }, // Équipe
      { width: 12 }, // Assurance
      { width: 18 }, // Cotisation payée
      { width: 10 }  // Actif
    ];

    XLSX.writeFile(wb, 'template_import_membres.xlsx');
  }

  /**
   * Lire le fichier Excel
   */
  private readExcelFile(file: File): Promise<ExcelRowData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          });

          if (jsonData.length < 2) {
            reject(new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const parsedData = this.mapRowsToObjects(headers, rows);
          resolve(parsedData);
          
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier Excel : ' + error));
        }
      };

      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Mapper les lignes Excel vers des objets
   */
  private mapRowsToObjects(headers: string[], rows: any[][]): ExcelRowData[] {
    const normalizedHeaders = this.normalizeHeaders(headers);
    
    return rows
      .filter(row => row.some(cell => cell !== '' && cell != null))
      .map(row => {
        const obj: ExcelRowData = {};
        
        normalizedHeaders.forEach((header, index) => {
          const value = row[index];
          if (value !== undefined && value !== null && value !== '') {
            obj[header as keyof ExcelRowData] = this.normalizeValue(value);
          }
        });
        
        return obj;
      });
  }

  /**
   * Normaliser les en-têtes de colonnes
   */
  private normalizeHeaders(headers: string[]): string[] {
    const mapping: { [key: string]: string } = {
      // Variations possibles des noms de colonnes
      'nom': 'nom',
      'nom*': 'nom',
      'prenom': 'prenom',
      'prénom': 'prenom',
      'prénom*': 'prenom',
      'prenom*': 'prenom',
      'sexe': 'sexe',
      'sexe*': 'sexe',
      'genre': 'sexe',
      'email': 'email',
      'e-mail': 'email',
      'mail': 'email',
      'telephone': 'telephone',
      'téléphone': 'telephone',
      'tel': 'telephone',
      'phone': 'telephone',
      'date de naissance': 'dateNaissance',
      'date_naissance': 'dateNaissance',
      'naissance': 'dateNaissance',
      'birth': 'dateNaissance',
      'poste': 'poste',
      'position': 'poste',
      'equipe': 'equipe',
      'équipe': 'equipe',
      'team': 'equipe',
      'assurance': 'assurance',
      'cotisation': 'cotisationPayee',
      'cotisation payee': 'cotisationPayee',
      'cotisation payée': 'cotisationPayee',
      'cotisation_payee': 'cotisationPayee',
      'actif': 'active',
      'active': 'active',
      'status': 'active'
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().trim();
      return mapping[normalized] || normalized;
    });
  }

  /**
   * Normaliser les valeurs de cellules
   */
  private normalizeValue(value: any): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value).trim();
  }

  /**
   * Valider et nettoyer les données
   */
  private validateAndCleanData(data: ExcelRowData[]): ExcelRowData[] {
    return data.map(row => {
      // Nettoyer les valeurs booléennes
      if (row.assurance) {
        row.assurance = this.parseBoolean(row.assurance);
      }
      if (row.cotisationPayee) {
        row.cotisationPayee = this.parseBoolean(row.cotisationPayee);
      }
      if (row.active) {
        row.active = this.parseBoolean(row.active);
      }

      // Nettoyer le sexe
      if (row.sexe) {
        row.sexe = this.normalizeSexe(row.sexe);
      }

      return row;
    });
  }

  /**
   * Parser les valeurs booléennes
   */
  private parseBoolean(value: string | boolean): boolean {
    if (typeof value === 'boolean') return value;
    
    const normalized = String(value).toLowerCase().trim();
    return ['oui', 'yes', 'true', '1', 'vrai', 'o', 'y'].includes(normalized);
  }

  /**
   * Normaliser les valeurs de sexe
   */
  private normalizeSexe(sexe: string): string {
    const normalized = sexe.toLowerCase().trim();
    
    if (['m', 'homme', 'masculin', 'male', 'h'].includes(normalized)) {
      return 'masculin';
    }
    if (['f', 'femme', 'feminin', 'féminin', 'female'].includes(normalized)) {
      return 'feminin';
    }
    
    return sexe; // Retourner la valeur originale si pas de correspondance
  }

  /**
   * Valider toutes les lignes
   */
  private validateAllRows(data: ExcelRowData[], equipes: any[]): {
    validRows: { data: ExcelRowData; rowIndex: number }[],
    errors: ImportError[]
  } {
    const validRows: { data: ExcelRowData; rowIndex: number }[] = [];
    const errors: ImportError[] = [];

    data.forEach((row, index) => {
      const rowIndex = index + 2; // +2 car Excel commence à 1 et on a les en-têtes
      const rowErrors = this.validateRow(row, rowIndex, equipes);
      
      if (rowErrors.length === 0) {
        validRows.push({ data: row, rowIndex });
      } else {
        errors.push(...rowErrors);
      }
    });

    return { validRows, errors };
  }

  /**
   * Valider une ligne individuelle
   */
  private validateRow(row: ExcelRowData, rowIndex: number, equipes: any[]): ImportError[] {
    const errors: ImportError[] = [];

    // Champs obligatoires
    if (!row.nom || row.nom.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'nom',
        message: 'Le nom est obligatoire',
        data: row
      });
    }

    if (!row.prenom || row.prenom.trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'prenom',
        message: 'Le prénom est obligatoire',
        data: row
      });
    }

    if (!row.sexe || !['masculin', 'feminin'].includes(row.sexe)) {
      errors.push({
        row: rowIndex,
        field: 'sexe',
        message: 'Le sexe doit être "masculin" ou "feminin"',
        data: row
      });
    }

    // Validation email
    if (row.email && !this.isValidEmail(row.email)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        message: 'Format d\'email invalide',
        data: row
      });
    }

    // Validation date
    if (row.dateNaissance && !this.isValidDate(row.dateNaissance)) {
      errors.push({
        row: rowIndex,
        field: 'dateNaissance',
        message: 'Format de date invalide (attendu: YYYY-MM-DD)',
        data: row
      });
    }

    // Validation équipe (optionnel mais doit exister si spécifiée)
    if (row.equipe && equipes.length > 0) {
      const equipeExists = equipes.some(e => 
        e.nom.toLowerCase() === row.equipe?.toLowerCase()
      );
      if (!equipeExists) {
        errors.push({
          row: rowIndex,
          field: 'equipe',
          message: `L'équipe "${row.equipe}" n'existe pas`,
          data: row
        });
      }
    }

    return errors;
  }

  /**
   * Traiter les lignes valides
   */
  private processValidRows(validRows: { data: ExcelRowData; rowIndex: number }[]): Observable<{
    success: boolean;
    member?: Membre;
    error?: string;
  }[]> {
    const groupe = this.authService.getGroupe();
    
    if (!groupe) {
      throw new Error('Aucun groupe actif');
    }

    // Si aucune ligne valide, retourner un tableau vide
    if (validRows.length === 0) {
      return of([]);
    }

    // Traitement en parallèle avec forkJoin
    const processObservables = validRows.map(({ data }) => 
      this.createMemberFromData(data, groupe).pipe(
        catchError(error => {
          console.error('Erreur pour une ligne:', error);
          return of({
            success: false,
            error: error?.error?.message || error?.message || 'Erreur lors du traitement'
          });
        })
      )
    );

    return forkJoin(processObservables);
  }

private createMemberFromData(data: ExcelRowData, groupe: any): Observable<{
  success: boolean;
  member?: Membre;
  error?: string;
}> {
  // 1️⃣ ÉTAPE 1: Créer d'abord l'utilisateur
  const username = `${data.nom?.toLowerCase()}_${data.prenom?.toLowerCase()}`;
  const newUser: User = {
    id: 0,
    username: username,
    email: data.email || `${username}@example.com`,
    motDePasse: data.nom || 'defaultPassword',
    roles: 'MEMBRE',
    active: true,
    membre: 0,
    groupe: groupe.id, // ✅ Correction: utiliser groupe.id
    profilePhotoUrl: ''
  };

  return this.userService.createUser(newUser).pipe(
    mergeMap(createdUser => {
      console.log('✅ Utilisateur créé:', createdUser.username);
      
      // 2️⃣ ÉTAPE 2: Récupérer les équipes disponibles
      return this.getEquipesByGroupe().pipe(
        mergeMap(equipes => {
          console.log('📋 Équipes disponibles:', equipes.map(e => e.nom));
          
          // 3️⃣ ÉTAPE 3: Trouver l'équipe correspondante si spécifiée
          let equipeToAssign: Equipe | null = null;;
          
          if (data.equipe && data.equipe.trim() !== '') {
            const foundEquipe = equipes.find(e => 
              e.nom.toLowerCase().trim() === data.equipe!.toLowerCase().trim()
            );
            
            if (foundEquipe) {
              equipeToAssign = { id: foundEquipe.id, nom: foundEquipe.nom, couleur: foundEquipe.couleu };
              console.log(`🏆 Équipe "${data.equipe}" trouvée avec ID:`, foundEquipe.id);
            } else {
              console.warn(`⚠️ Équipe "${data.equipe}" non trouvée. Équipes disponibles: ${equipes.map(e => e.nom).join(', ')}`);
              // Continue quand même la création sans équipe
            }
          } else {
            console.log('ℹ️ Aucune équipe spécifiée pour ce membre');
          }
          
          // 4️⃣ ÉTAPE 4: Créer le membre avec toutes les infos
          const newMembre: Membre = this.buildMembreFromData(data, groupe, createdUser, equipeToAssign);
          
          return this.membreService.createMember(newMembre).pipe(
            map(membre => {
              console.log('✅ Membre créé:', `${membre.nom} ${membre.prenom}`, equipeToAssign ? `- Équipe: ${equipeToAssign.nom}` : '- Sans équipe');
              return { success: true, member: membre };
            }),
            catchError(error => {
              console.error('❌ Erreur création membre:', error);
              return of({ 
                success: false, 
                error: error.error?.message || 'Erreur lors de la création du membre' 
              });
            })
          );
        }),
        catchError(error => {
          console.error('❌ Erreur récupération équipes:', error);
          // En cas d'erreur équipes, créer le membre sans équipe
          const newMembre: Membre = this.buildMembreFromData2(data, groupe, createdUser);
          
          return this.membreService.createMember(newMembre).pipe(
            map(membre => {
              console.log('⚠️ Membre créé sans équipe (erreur récupération équipes):', `${membre.nom} ${membre.prenom}`);
              return { success: true, member: membre };
            }),
            catchError(memberError => of({ 
              success: false, 
              error: memberError.error?.message || 'Erreur lors de la création du membre' 
            }))
          );
        })
      );
    }),
    catchError(error => {
      console.error('❌ Erreur création utilisateur:', error);
      return of({ 
        success: false, 
        error: error.error?.message || 'Erreur lors de la création de l\'utilisateur' 
      });
    })
  );
}

  /**
   * Construire l'objet Membre à partir des données Excel
   */
  private buildMembreFromData(data: ExcelRowData, groupe: any, user: User, equipe: Equipe | null ): any {
    console.log(equipe)
    return {
      id: 0,
      nom: data.nom!,
      prenom: data.prenom!,
      sexe: data.sexe!,
      email: data.email || '',
      tel: data.telephone || '',
      dateNaissance: data.dateNaissance || '',
      poste: data.poste || '',
      equipe: equipe || null, // Utiliser l'équipe trouvée avec son ID
      groupe: groupe,
      user: user,
      active: data.active !== undefined ? data.active as boolean : true,
      cotisationPayee: data.cotisationPayee !== undefined ? data.cotisationPayee as boolean : false,
      assurance: data.assurance !== undefined ? data.assurance as boolean : true,
      roleCO: '',
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      cni: '',
      adresse: ''
    };
  }

  private buildMembreFromData2(data: ExcelRowData, groupe: any, user: User ): any {
    return {
      id: 0,
      nom: data.nom!,
      prenom: data.prenom!,
      sexe: data.sexe!,
      email: data.email || '',
      tel: data.telephone || '',
      dateNaissance: data.dateNaissance || '',
      poste: data.poste || '',
      groupe: groupe,
      equipe:{
        id: 0,
        nom: ''
      },
      user: user,
      active: data.active !== undefined ? data.active as boolean : true,
      cotisationPayee: data.cotisationPayee !== undefined ? data.cotisationPayee as boolean : false,
      assurance: data.assurance !== undefined ? data.assurance as boolean : true,
      roleCO: '',
      buts: 0,
      passes: 0,
      cartons: 0,
      totalContributions: 0,
      soldeRestant: 0,
      soldeSanctionsRestant: 0,
      cni: '',
      adresse: ''
    };
  }

  /**
   * Récupérer les équipes du groupe actuel
   */
  private getEquipesByGroupe(): Observable<any[]> {
    if (this.equipeService && this.equipeService.getEquipesByGroupe) {
      return this.equipeService.getEquipesByGroupe();
    }
    
    // Fallback: retourner un tableau vide si le service n'est pas configuré
    console.warn('Service d\'équipes non configuré. Les équipes ne seront pas assignées.');
    return of([]);
  }

  /**
   * Valider un email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider une date
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}