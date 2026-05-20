import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
}

export interface UserStats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  stats: UserStats;
}

import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/users`;

  getUsers(page: number = 1, limit: number = 10, search: string = '', status: string = ''): Observable<UsersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);

    return this.http.get<UsersResponse>(this.apiUrl, { params });
  }

  updateUserStatus(id: number, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING'): Observable<{ message: string, user: User }> {
    return this.http.put<{ message: string, user: User }>(`${this.apiUrl}/${id}/status`, { status });
  }
}
