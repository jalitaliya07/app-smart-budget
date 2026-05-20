import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-settings-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  darkMode = false;
  profileForm!: FormGroup;
  isLoading = false;

  // Delegate Access (Passkey) state
  delegatePasskey: string | null = null;
  delegatePasskeyExpiry: string | null = null;
  isGeneratingPasskey = false;
  isRegeneratingPasskey = false;
  passkeyJustCopied = false;

  ngOnInit() {
    this.darkMode = document.body.classList.contains('dark');

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
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

    // Load any existing active passkey
    this.loadMyPasskey();
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
