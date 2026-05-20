import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserStats } from '../../../core/services/user';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagementPage implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  users: User[] = [];
  stats: UserStats = { total: 0, pending: 0, approved: 0, suspended: 0 };
  
  // Filters and Pagination
  searchQuery: string = '';
  statusFilter: string = '';
  currentPage: number = 1;
  totalPages: number = 1;
  limit: number = 10;
  
  isLoading: boolean = false;
  isUpdatingId: number | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getUsers(this.currentPage, this.limit, this.searchQuery, this.statusFilter).subscribe({
      next: (res) => {
        this.users = res.users;
        this.stats = res.stats;
        this.totalPages = res.pagination.pages;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.show('Error', 'Failed to load users. Are you an admin?', 'error');
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterStatus(status: string) {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadUsers();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  updateStatus(user: User, newStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING') {
    if (!confirm(`Are you sure you want to change ${user.name}'s status to ${newStatus}?`)) return;

    this.isUpdatingId = user.id;
    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.isUpdatingId = null;
        user.status = newStatus;
        this.toastService.show('Success', `${user.name} is now ${newStatus}.`, 'success');
        this.loadUsers(); // Refresh stats
      },
      error: (err) => {
        this.isUpdatingId = null;
        this.toastService.show('Error', 'Failed to update status.', 'error');
      }
    });
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SUSPENDED': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-800';
    }
  }
}
