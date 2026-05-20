import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BankService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/banks';

  private banksSubject = new BehaviorSubject<any[]>([]);
  public banks$ = this.banksSubject.asObservable();

  loadBanks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(banks => {
        this.banksSubject.next(banks || []);
      }),
      catchError(() => {
        this.banksSubject.next([]);
        return of([]);
      })
    );
  }

  createBank(bank: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, bank).pipe(
      tap(newBank => {
        const current = this.banksSubject.value;
        this.banksSubject.next([...current, newBank]);
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  deleteBank(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.banksSubject.value;
        this.banksSubject.next(current.filter(b => b.id !== id));
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  getCurrentBanks(): any[] {
    return this.banksSubject.value || [];
  }
}
