import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/expenses';

  private expensesSubject = new BehaviorSubject<any[]>([]);
  public expenses$ = this.expensesSubject.asObservable();

  loadExpenses(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(expenses => {
        this.expensesSubject.next(expenses || []);
      }),
      catchError(() => {
        this.expensesSubject.next([]);
        return of([]);
      })
    );
  }

  createExpense(expense: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, expense).pipe(
      tap(newExpense => {
        const current = this.expensesSubject.value;
        this.expensesSubject.next([newExpense, ...current]);
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  updateExpense(expense: any): void {
    const current = this.expensesSubject.value.map(e => e.id === expense.id ? { ...e, ...expense } : e);
    this.expensesSubject.next(current);
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.expensesSubject.value.filter(e => e.id !== id);
        this.expensesSubject.next(current);
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  getCurrentExpenses(): any[] {
    return this.expensesSubject.value || [];
  }
}
