import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/categories';

  private categoriesSubject = new BehaviorSubject<any[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  loadCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(categories => {
        this.categoriesSubject.next(categories || []);
      }),
      catchError(() => {
        this.categoriesSubject.next([]);
        return of([]);
      })
    );
  }

  getCategories(): Observable<any[]> {
    return this.loadCategories();
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, category).pipe(
      tap(newCategory => {
        const current = this.categoriesSubject.value;
        this.categoriesSubject.next([...current, newCategory]);
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.categoriesSubject.value;
        this.categoriesSubject.next(current.filter(c => c.id !== id));
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  getCurrentCategories(): any[] {
    return this.categoriesSubject.value || [];
  }
}
