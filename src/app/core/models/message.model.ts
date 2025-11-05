// src/app/modules/chat/models/message.model.ts

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

export enum SystemMessageType {
  MATCH_ACCEPTED = 'MATCH_ACCEPTED',
  MATCH_REFUSED = 'MATCH_REFUSED',
  MATCH_PROPOSED = 'MATCH_PROPOSED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  CONVERSATION_CREATED = 'CONVERSATION_CREATED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED'
}

export interface Message {
  id: number;
  conversationId: number;
  sender?: User;
  type: MessageType;
  content: string;
  isSystemMessage: boolean;
  systemMessageType?: SystemMessageType;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  editedAt?: Date;
  attachments: Attachment[];
  readStatuses: ReadStatus[];
}

export interface Attachment {
  id: number;
  type: AttachmentType;
  url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

export enum AttachmentType {
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  VIDEO = 'VIDEO'
}

export interface ReadStatus {
  userId: number;
  userName: string;
  readAt: Date;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photoUrl?: string;
}