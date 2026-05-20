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
}
