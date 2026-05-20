import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';
  private delegateUrl = 'http://localhost:3000/api/delegate';
  private currentUserSubject = new BehaviorSubject<any>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        this.currentUserSubject.next(JSON.parse(userStr));
      } catch (e) {
        this.currentUserSubject.next({ token });
      }
    } else if (token) {
      this.currentUserSubject.next({ token });
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  updateProfile(data: { name: string; email: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data).pipe(
      tap(response => {
        const currentUser = this.currentUserSubject.value;
        const updatedUser = { ...currentUser, ...response.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  /** User2 uses a passkey to access User1's account */
  accessViaPasskey(payload: { passkey: string; guestName: string; guestEmail: string }): Observable<any> {
    return this.http.post<any>(`${this.delegateUrl}/access`, payload).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  /** User1 generates a passkey to share with someone */
  generateDelegatePasskey(): Observable<any> {
    return this.http.post<any>(`${this.delegateUrl}/generate-passkey`, {});
  }

  /** User1 regenerates their passkey and emails approved guests */
  regenerateDelegatePasskey(): Observable<any> {
    return this.http.post<any>(`${this.delegateUrl}/regenerate-passkey`, {});
  }

  /** User1 fetches their current active passkey */
  getMyPasskey(): Observable<any> {
    return this.http.get<any>(`${this.delegateUrl}/my-passkey`);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
