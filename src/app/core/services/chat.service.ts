// src/app/modules/chat/services/chat.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // ========== Conversations ==========

  getUserConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  getConversationById(conversationId: number): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  createMatchRequestConversation(matchRequestId: number, responsableIds: number[]): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations/match-request`, {
      matchRequestId,
      responsableIds
    });
  }

  createPrivateConversation(otherUserId: number): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations/private`, {
      otherUserId
    });
  }

  createGroupConversation(titre: string, participantIds: number[], adminIds: number[]): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/conversations/group`, {
      titre,
      participantIds,
      adminIds
    });
  }

  leaveConversation(conversationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/leave`, {});
  }

  archiveConversation(conversationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/conversations/${conversationId}/archive`, {});
  }

  markAsRead(conversationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/mark-read`, {});
  }

  getTotalUnreadCount(): Observable<{ totalUnreadCount: number }> {
    return this.http.get<{ totalUnreadCount: number }>(`${this.apiUrl}/conversations/unread-count`);
  }

  updateNotificationSettings(conversationId: number, isMuted: boolean, mutedUntil?: Date): Observable<any> {
    return this.http.put(`${this.apiUrl}/conversations/${conversationId}/notifications`, {
      isMuted,
      mutedUntil
    });
  }

  // ========== Messages ==========

  getMessages(conversationId: number, page: number = 0, size: number = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
    return this.http.get<any>(`${this.apiUrl}/conversations/${conversationId}/messages`, { params });
  }

  getNewMessages(conversationId: number, since: Date): Observable<Message[]> {
    const params = new HttpParams().set('since', since.toISOString());
    return this.http.get<Message[]>(`${this.apiUrl}/conversations/${conversationId}/messages/new`, { params });
  }

  sendMessage(conversationId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/conversations/${conversationId}/messages`, {
      content
    });
  }

  sendMessageWithAttachment(conversationId: number, content: string, file: File): Observable<Message> {
    const formData = new FormData();
    if (content) {
      formData.append('content', content);
    }
    formData.append('file', file);
    
    return this.http.post<Message>(
      `${this.apiUrl}/conversations/${conversationId}/messages/with-attachment`,
      formData
    );
  }

  editMessage(conversationId: number, messageId: number, newContent: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/conversations/${conversationId}/messages/${messageId}`, {
      newContent
    });
  }

  deleteMessage(conversationId: number, messageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/conversations/${conversationId}/messages/${messageId}`);
  }
}