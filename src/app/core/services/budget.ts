import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/budgets`;

  private budgetsSubject = new BehaviorSubject<any[]>([]);
  public budgets$ = this.budgetsSubject.asObservable();

  loadBudgets(month?: number, year?: number): Observable<any[]> {
    let url = this.apiUrl;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return this.http.get<any[]>(url).pipe(
      tap(budgets => {
        this.budgetsSubject.next(budgets || []);
      }),
      catchError(() => {
        this.budgetsSubject.next([]);
        return of([]);
      })
    );
  }

  createBudget(budget: any, categoryObj?: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, budget).pipe(
      tap(newBudget => {
        const current = this.budgetsSubject.value;
        this.budgetsSubject.next([...current, newBudget]);
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  getCurrentBudgets(): any[] {
    return this.budgetsSubject.value || [];
  }

  updateBudget(id: number, budget: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, budget).pipe(
      tap(updatedBudget => {
        const current = this.budgetsSubject.value;
        const index = current.findIndex(b => b.id === id);
        if (index > -1) {
          const updatedList = [...current];
          updatedList[index] = updatedBudget;
          this.budgetsSubject.next(updatedList);
        }
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  deleteBudget(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.budgetsSubject.value;
        const updatedList = current.filter(b => b.id !== id);
        this.budgetsSubject.next(updatedList);
      }),
      catchError(err => {
        throw err;
      })
    );
  }
}
