import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  showProfileDropdown = false;
  showNotificationDropdown = false;
  currentUser: any = null;

  notifications = [
    {
      id: 1,
      icon: '🔒',
      title: 'Delegate Access Request',
      message: 'A new guest has requested passkey approval to view your budgets.',
      time: 'Just now'
    },
    {
      id: 2,
      icon: '⚠️',
      title: 'Budget Alert',
      message: 'You have reached 90% of your Food category budget limit.',
      time: '15 mins ago'
    },
    {
      id: 3,
      icon: '💡',
      title: 'AI Saving Recommendation',
      message: 'Readjusting Groceries category limit could save you up to ₹150.',
      time: '2 hours ago'
    },
    {
      id: 4,
      icon: '💸',
      title: 'New Expense Added',
      message: 'Monthly Rent of ₹1,200.00 was successfully recorded.',
      time: '1 day ago'
    }
  ];

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleProfile() {
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showNotificationDropdown = false;
  }

  toggleNotifications() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
    this.showProfileDropdown = false;
  }

  getInitials(): string {
    if (!this.currentUser || !this.currentUser.name) return 'U';
    const parts = this.currentUser.name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
