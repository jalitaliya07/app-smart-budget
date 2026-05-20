import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BankService } from '../../../core/services/bank';

@Component({
  selector: 'app-expense-form-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form-modal.html',
  styleUrl: './expense-form-modal.css',
})
export class ExpenseFormModal implements OnInit {
  @Input() expense: any = null;
  @Input() categories: any[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveExpense = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  bankService = inject(BankService);
  expenseForm!: FormGroup;

  paymentMethods = ['Bank', 'Cash'];
  bankTypes = ['Card', 'UPI'];
  banks: any[] = [];

  get isBankSelected(): boolean {
    return this.expenseForm?.get('paymentMethod')?.value === 'Bank';
  }

  ngOnInit() {
    const paymentMethodVal = this.expense?.paymentMethod || 'Bank';
    let cleanMethod = paymentMethodVal;
    let bankType = '';
    let bankName = '';

    if (paymentMethodVal.startsWith('Bank')) {
      cleanMethod = 'Bank';
      const parts = paymentMethodVal.match(/\(([^)]+)\)/);
      if (parts && parts[1]) {
        const subParts = parts[1].split(' - ');
        bankType = subParts[0] || 'Card';
        bankName = subParts[1] || '';
      } else {
        bankType = paymentMethodVal.includes('UPI') ? 'UPI' : 'Card';
      }
    } else if (paymentMethodVal !== 'Cash') {
      cleanMethod = 'Bank'; // Default legacy methods to Bank
    }

    this.expenseForm = this.fb.group({
      title: [this.expense?.title || '', [Validators.required]],
      amount: [this.expense?.amount || '', [Validators.required, Validators.min(0.01)]],
      categoryId: [this.expense?.categoryId || (this.categories[0]?.id || ''), [Validators.required]],
      paymentMethod: [cleanMethod, [Validators.required]],
      bankPaymentType: [bankType],
      bankName: [bankName],
      expenseDate: [this.formatDate(this.expense?.expenseDate || new Date()), [Validators.required]],
      notes: [this.expense?.notes || '']
    });

    // Load banks dynamically
    this.bankService.loadBanks().subscribe(banks => {
      this.banks = banks || [];
      if (this.banks.length > 0 && !this.expenseForm.get('bankName')?.value) {
        this.expenseForm.patchValue({ bankName: this.banks[0].name });
      }
    });

    // Handle bankPaymentType and bankName validation dynamically based on paymentMethod
    this.expenseForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      const typeCtrl = this.expenseForm.get('bankPaymentType');
      const bankCtrl = this.expenseForm.get('bankName');
      if (method === 'Bank') {
        typeCtrl?.setValidators([Validators.required]);
        bankCtrl?.setValidators([Validators.required]);
      } else {
        typeCtrl?.clearValidators();
        bankCtrl?.clearValidators();
      }
      typeCtrl?.updateValueAndValidity();
      bankCtrl?.updateValueAndValidity();
    });

    // Initial check
    const initialMethod = this.expenseForm.get('paymentMethod')?.value;
    const typeCtrl = this.expenseForm.get('bankPaymentType');
    const bankCtrl = this.expenseForm.get('bankName');
    if (initialMethod === 'Bank') {
      typeCtrl?.setValidators([Validators.required]);
      bankCtrl?.setValidators([Validators.required]);
    } else {
      typeCtrl?.clearValidators();
      bankCtrl?.clearValidators();
    }
    typeCtrl?.updateValueAndValidity();
    bankCtrl?.updateValueAndValidity();
  }

  formatDate(date: Date | string) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formValue = { ...this.expenseForm.value };
      if (formValue.paymentMethod === 'Bank') {
        formValue.paymentMethod = `Bank (${formValue.bankPaymentType} - ${formValue.bankName})`;
      }
      delete formValue.bankPaymentType;
      delete formValue.bankName;
      this.saveExpense.emit(formValue);
    } else {
      this.expenseForm.markAllAsTouched();
    }
  }
}
