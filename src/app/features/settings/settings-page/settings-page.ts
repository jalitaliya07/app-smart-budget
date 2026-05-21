import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ContextService, Workspace } from '../../../core/services/context';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private contextService = inject(ContextService);

  darkMode = false;
  profileForm!: FormGroup;
  isLoading = false;

  // Custom Workspaces state
  workspaces: Workspace[] = [];
  showWorkspaceModal = false;
  workspaceForm!: FormGroup;
  editingWorkspaceId: string | null = null;
  quickEmojis = ['💼', '👤', '🏠', '🏢', '✈️', '🎓', '🏥', '🛒', '🍔', '🏋️', '🚗', '🍿'];

  // Delegate Access (Passkey) state
  delegatePasskey: string | null = null;
  delegatePasskeyExpiry: string | null = null;
  isGeneratingPasskey = false;
  isRegeneratingPasskey = false;
  passkeyJustCopied = false;

  private subs = new Subscription();

  ngOnInit() {
    this.darkMode = document.body.classList.contains('dark');

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.workspaceForm = this.fb.group({
      name: ['', Validators.required],
      emoji: ['💼', Validators.required],
      keywords: ['']
    });

    // Populate the form with current user details
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          name: user.name || '',
          email: user.email || ''
        });
      }
    });

    // Subscribe to workspaces changes
    this.subs.add(
      this.contextService.workspaces$.subscribe(wsList => {
        this.workspaces = wsList;
      })
    );

    // Load any existing active passkey
    this.loadMyPasskey();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadMyPasskey() {
    this.authService.getMyPasskey().subscribe({
      next: (res) => {
        if (res.passkey) {
          this.delegatePasskey = res.passkey;
          this.delegatePasskeyExpiry = res.expiresAt;
        }
      },
      error: () => {} // silently ignore if no passkey exists
    });
  }

  toggleDark() {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.toastService.show('Form Invalid', 'Please enter a valid name and email.', 'warning');
      return;
    }

    this.isLoading = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.show('Success', 'Profile updated successfully.', 'success');
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.error || 'Failed to update profile.';
        this.toastService.show('Error', msg, 'error');
      }
    });
  }

  // Custom Workspace Methods
  openAddWorkspaceModal() {
    this.editingWorkspaceId = null;
    this.workspaceForm.reset({
      name: '',
      emoji: '💼',
      keywords: ''
    });
    this.showWorkspaceModal = true;
  }

  onEditWorkspace(ws: Workspace) {
    this.editingWorkspaceId = ws.id;
    this.workspaceForm.patchValue({
      name: ws.name,
      emoji: ws.emoji,
      keywords: ws.keywords.join(', ')
    });
    this.showWorkspaceModal = true;
  }

  closeWorkspaceModal() {
    this.showWorkspaceModal = false;
  }

  onSaveWorkspace() {
    if (this.workspaceForm.invalid) return;

    const { name, emoji, keywords } = this.workspaceForm.value;
    const cleanKeywords = (keywords || '')
      .split(',')
      .map((k: string) => k.trim().toLowerCase())
      .filter((k: string) => k.length > 0);

    if (this.editingWorkspaceId) {
      // update
      this.contextService.updateWorkspace(this.editingWorkspaceId, {
        name: name.trim(),
        emoji: emoji.trim() || '💼',
        keywords: cleanKeywords
      });
      this.toastService.show('Workspace Updated', `Successfully updated "${name}".`, 'success');
    } else {
      // create
      const id = name.trim().replace(/\s+/g, '-');
      this.contextService.addWorkspace({
        id,
        name: name.trim(),
        emoji: emoji.trim() || '💼',
        keywords: cleanKeywords
      });
      this.toastService.show('Workspace Created', `Successfully created custom workspace "${name}".`, 'success');
    }

    this.closeWorkspaceModal();
  }

  onDeleteWorkspace(id: string) {
    if (confirm('Are you sure you want to delete this custom workspace?')) {
      this.contextService.deleteWorkspace(id);
      this.toastService.show('Workspace Deleted', 'The custom workspace was removed.', 'success');
    }
  }

  generatePasskey() {
    this.isGeneratingPasskey = true;
    this.authService.generateDelegatePasskey().subscribe({
      next: (res) => {
        this.isGeneratingPasskey = false;
        this.delegatePasskey = res.passkey;
        this.delegatePasskeyExpiry = res.expiresAt;
        this.toastService.show('Passkey Generated! 🔑', 'Share this passkey with the person you want to grant access to. It is permanent and reusable.', 'success');
      },
      error: (err) => {
        this.isGeneratingPasskey = false;
        this.toastService.show('Error', err.error?.error || 'Failed to generate passkey.', 'error');
      }
    });
  }

  regeneratePasskey() {
    this.isRegeneratingPasskey = true;
    this.authService.regenerateDelegatePasskey().subscribe({
      next: (res) => {
        this.isRegeneratingPasskey = false;
        this.delegatePasskey = res.passkey;
        this.delegatePasskeyExpiry = res.expiresAt;
        this.toastService.show('Passkey Regenerated! 🔄', 'All approved users have been notified with the new passkey via email.', 'success');
      },
      error: (err) => {
        this.isRegeneratingPasskey = false;
        this.toastService.show('Error', err.error?.error || 'Failed to regenerate passkey.', 'error');
      }
    });
  }

  copyPasskey() {
    if (!this.delegatePasskey) return;
    navigator.clipboard.writeText(this.delegatePasskey).then(() => {
      this.passkeyJustCopied = true;
      setTimeout(() => this.passkeyJustCopied = false, 2000);
    });
  }
}
