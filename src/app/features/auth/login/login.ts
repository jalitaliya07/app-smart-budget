import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  error: string = '';
  isLoading: boolean = false;

  // Passkey delegate access state
  showPasskeyMode: boolean = false;
  passkey: string = '';
  guestName: string = '';
  guestEmail: string = '';
  isLinking: boolean = false;
  linkSuccess: boolean = false;
  linkSuccessMessage: string = '';

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Login failed. Please check your credentials.';
        this.isLoading = false;
      }
    });
  }

  togglePasskeyMode() {
    this.showPasskeyMode = !this.showPasskeyMode;
    this.error = '';
    this.passkey = '';
    this.guestName = '';
    this.guestEmail = '';
    this.linkSuccess = false;
    this.linkSuccessMessage = '';
  }

  connectWithPasskey(event: Event) {
    event.preventDefault();

    const trimmedKey = this.passkey.trim().toUpperCase();
    if (!trimmedKey || trimmedKey.length < 6) {
      this.error = 'Please enter a valid passkey (min 6 characters).';
      return;
    }
    if (!this.guestName.trim()) {
      this.error = 'Please enter your name so the account owner knows who is accessing.';
      return;
    }
    if (!this.guestEmail.trim()) {
      this.error = 'Please enter your email address.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.guestEmail.trim())) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    this.isLinking = true;
    this.error = '';

    this.authService.accessViaPasskey({
      passkey: trimmedKey,
      guestName: this.guestName.trim(),
      guestEmail: this.guestEmail.trim()
    }).subscribe({
      next: (res: any) => {
        this.isLinking = false;
        this.linkSuccess = true;
        this.linkSuccessMessage = res.message || 'Access granted!';
        
        // If the request was just sent for approval, do NOT redirect.
        if (res.status === 'PENDING') {
           // stay on page, let user read message
        } else {
           // If already approved, redirect to dashboard after 2 seconds
           setTimeout(() => {
             this.router.navigate(['/dashboard']);
           }, 2000);
        }
      },
      error: (err) => {
        this.isLinking = false;
        this.error = err.error?.error || 'Failed to verify passkey. Please try again.';
      }
    });
  }
}

