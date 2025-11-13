import { Message } from "./message.model";

export enum ConversationType {
  GROUP = 'GROUP',
  PRIVATE = 'PRIVATE',
  MATCH_REQUEST = 'MATCH_REQUEST'
}

export interface ConversationMetadata {
  matchRequestId?: number;
  groupeId?: number;
}

export interface ConversationSettings {
  canLeave: boolean;
  canAddMembers: boolean;
  onlyAdminsCanWrite: boolean;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  titre?: string;
  imageUrl?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;
  settings?: ConversationSettings;
  participants: Participant[];
  unreadCount: number;
  lastMessage?: Message;
  createdBy: User;
}

export interface Participant {
  id: number;
  user: User;
  role: ParticipantRole;
  isMuted: boolean;
  mutedUntil?: Date;
  lastReadAt: Date;
  unreadCount: number;
  joinedAt: Date;
}

export enum ParticipantRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photoUrl?: string;
}