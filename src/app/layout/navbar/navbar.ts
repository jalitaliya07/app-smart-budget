import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContextService, Workspace } from '../../core/services/context';
import { SidebarService } from '../../core/services/sidebar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  auth = inject(AuthService);
  router = inject(Router);
  contextService = inject(ContextService);
  sidebarService = inject(SidebarService);

  selectedContext = 'All';
  workspaces: Workspace[] = [];

  // Dropdown states
  showWorkspaceDropdown = false;
  showProfileDropdown = false;
  showNotificationDropdown = false;

  // Modal State for quick add workspace
  showAddModal = false;
  newWorkspaceName = '';
  newWorkspaceEmoji = '💼';
  newWorkspaceKeywords = '';
  quickEmojis = ['💼', '👤', '🏠', '🏢', '✈️', '🎓', '🏥', '🛒', '🍔', '🏋️', '🚗', '🍿'];

  private subs = new Subscription();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showWorkspaceDropdown = false;
    this.showProfileDropdown = false;
    this.showNotificationDropdown = false;
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

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

    this.subs.add(
      this.contextService.workspaces$.subscribe(workspaces => {
        this.workspaces = workspaces;
      })
    );

    this.subs.add(
      this.contextService.context$.subscribe(ctx => {
        this.selectedContext = ctx;
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toggleProfile(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showNotificationDropdown = false;
    this.showWorkspaceDropdown = false;
  }

  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotificationDropdown = !this.showNotificationDropdown;
    this.showProfileDropdown = false;
    this.showWorkspaceDropdown = false;
  }

  getInitials(): string {
    if (!this.currentUser || !this.currentUser.name) return 'U';
    const parts = this.currentUser.name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  toggleWorkspaceDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showWorkspaceDropdown = !this.showWorkspaceDropdown;
    this.showProfileDropdown = false;
    this.showNotificationDropdown = false;
  }

  selectWorkspace(wsId: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedContext = wsId;
    this.contextService.setContext(wsId);
    this.showWorkspaceDropdown = false;
  }

  triggerAddWorkspace(event: MouseEvent) {
    event.stopPropagation();
    this.showWorkspaceDropdown = false;
    this.openAddWorkspaceModal();
  }

  getActiveWorkspaceEmoji(): string {
    if (this.selectedContext === 'All') return '💼';
    const active = this.workspaces.find(w => w.id === this.selectedContext);
    return active ? active.emoji : '💼';
  }

  getActiveWorkspaceName(): string {
    if (this.selectedContext === 'All') return 'All Workspaces';
    const active = this.workspaces.find(w => w.id === this.selectedContext);
    return active ? active.name : this.selectedContext;
  }

  openAddWorkspaceModal() {
    this.showAddModal = true;
    this.newWorkspaceName = '';
    this.newWorkspaceEmoji = '💼';
    this.newWorkspaceKeywords = '';
  }

  closeAddWorkspaceModal() {
    this.showAddModal = false;
  }

  onSaveNewWorkspace() {
    if (!this.newWorkspaceName.trim()) return;

    const id = this.newWorkspaceName.trim().replace(/\s+/g, '-');
    const name = this.newWorkspaceName.trim();
    const emoji = this.newWorkspaceEmoji.trim() || '💼';
    const keywords = this.newWorkspaceKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    this.contextService.addWorkspace({
      id,
      name,
      emoji,
      keywords
    });

    this.contextService.setContext(id);
    this.closeAddWorkspaceModal();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
