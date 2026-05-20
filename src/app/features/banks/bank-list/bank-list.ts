import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../../core/services/bank';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-bank-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-list.html',
  styleUrl: './bank-list.css',
})
export class BankList implements OnInit {
  bankService = inject(BankService);
  toastService = inject(ToastService);

  banks: any[] = [];
  isAddOpen = false;
  newBank = { name: '', color: '#4F46E5' };

  ngOnInit() {
    this.bankService.banks$.subscribe(data => {
      this.banks = data || [];
    });
    this.bankService.loadBanks().subscribe();
  }

  saveBank() {
    if (!this.newBank.name) return;

    this.bankService.createBank(this.newBank).subscribe({
      next: (res) => {
        this.toastService.show('Bank Added', `Successfully added bank "${res.name}".`, 'success');
        this.isAddOpen = false;
        this.newBank = { name: '', color: '#4F46E5' };
      },
      error: () => {
        this.toastService.show('Error', 'Failed to add bank account.', 'error');
      }
    });
  }

  deleteBank(id: number) {
    if (confirm('Are you sure you want to delete this bank?')) {
      this.bankService.deleteBank(id).subscribe({
        next: () => {
          this.toastService.show('Deleted', 'Bank account successfully removed.', 'success');
        },
        error: () => {
          this.toastService.show('Error', 'Failed to delete bank account.', 'error');
        }
      });
    }
  }
}
