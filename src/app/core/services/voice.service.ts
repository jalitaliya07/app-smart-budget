import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private http = inject(HttpClient);
  
  parseVoiceText(text: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/voice-expense/parse`, { text });
  }

  saveVoiceTransaction(data: {
    voiceText: string;
    amount: number;
    categoryName: string;
    type: string;
    title: string;
    date?: string;
  }): Observable<any> {
    return this.http.post(`${API_BASE_URL}/api/voice-expense/save`, data);
  }

  getVoiceHistory(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/api/voice-expense/history`);
  }

  getVoiceAnalytics(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/api/voice-expense/analytics`);
  }

  createSpeechRecognition(lang: string = 'en-US'): any {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const RecognitionClass = webkitSpeechRecognition || SpeechRecognition;
    if (!RecognitionClass) {
      return null;
    }
    const recognition = new RecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;
    return recognition;
  }
}
