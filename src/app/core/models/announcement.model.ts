import { Groupe } from './groupe.model';

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  date: Date;
  groupe: Groupe;
}