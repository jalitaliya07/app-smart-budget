import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);

  baseMenuItems = [
    { label: 'Dashboard', emoji: '📊', route: '/dashboard' },
    { label: 'Expenses', emoji: '💸', route: '/expenses' },
    { label: 'Budgets', emoji: '💰', route: '/budgets' },
    { label: 'Reports', emoji: '📈', route: '/reports' },
    { label: 'Settings', emoji: '⚙️', route: '/settings' },
    { label: 'Bank', emoji: '🏦', route: '/banks' },
    { label: 'Category', emoji: '🏷️', route: '/categories' }
  ];

  menuItems = [...this.baseMenuItems];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.menuItems = [...this.baseMenuItems];
      if (user) {
        this.menuItems.push({ label: 'Users', emoji: '👥', route: '/users' });
      }
    });
  }
}
