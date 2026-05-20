import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { SidebarService } from '../../core/services/sidebar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);

  isOpen = false;
  private subUser!: Subscription;
  private subSidebar!: Subscription;

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
    this.subUser = this.authService.currentUser$.subscribe(user => {
      this.menuItems = [...this.baseMenuItems];
      if (user) {
        this.menuItems.push({ label: 'Users', emoji: '👥', route: '/users' });
      }
    });

    this.subSidebar = this.sidebarService.isOpen$.subscribe(open => {
      this.isOpen = open;
    });
  }

  ngOnDestroy() {
    if (this.subUser) this.subUser.unsubscribe();
    if (this.subSidebar) this.subSidebar.unsubscribe();
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  closeSidebarOnMobile() {
    if (this.sidebarService.isOpen()) {
      this.sidebarService.setOpen(false);
    }
  }
}
