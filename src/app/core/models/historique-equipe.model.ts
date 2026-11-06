export interface HistoriqueEquipe {
  id: number;
  equipeId: number;
  equipeNom: string;
  dateDebut: string; // ISO string
  dateFin: string | null; // null = en cours
  source: string;
}