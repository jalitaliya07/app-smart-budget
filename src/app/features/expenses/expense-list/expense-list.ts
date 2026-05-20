import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../../core/services/expense';
import { CategoryService } from '../../../core/services/category';
import { ToastService } from '../../../core/services/toast';
import { ExpenseFormModal } from '../expense-form-modal/expense-form-modal';

@Component({
  selector: 'app-expense-list',
  imports: [CommonModule, FormsModule, ExpenseFormModal],
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css',
})
export class ExpenseList implements OnInit {
  expenseService = inject(ExpenseService);
  categoryService = inject(CategoryService);
  toastService = inject(ToastService);

  expenses: any[] = [];
  filteredExpenses: any[] = [];
  categories: any[] = [];

  searchTerm = '';
  selectedCategory = '';

  isModalOpen = false;
  selectedExpense: any = null;

  get totalMonthlyExpense(): number {
    return this.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  ngOnInit() {
    this.expenseService.expenses$.subscribe(data => {
      this.expenses = data || [];
      this.filterExpenses();
    });

    this.expenseService.loadExpenses().subscribe();

    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  filterExpenses() {
    this.filteredExpenses = this.expenses.filter(e => {
      const matchesSearch = !this.searchTerm || 
                            e.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                            (e.notes && e.notes.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesCat = !this.selectedCategory || (e.category && e.category.name === this.selectedCategory);
      return matchesSearch && matchesCat;
    });
  }

  openAddModal() {
    this.selectedExpense = null;
    this.isModalOpen = true;
  }

  openEditModal(expense: any) {
    this.selectedExpense = expense;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedExpense = null;
  }

  deleteExpense(id: number) {
    if (confirm('Are you sure you want to delete this expense?')) {
      const deleted = this.expenses.find(e => e.id === id);
      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          this.toastService.show('Expense Deleted', `Deleted transaction "${deleted?.title || ''}".`, 'info');
        },
        error: () => {
          this.toastService.show('Error', 'Failed to delete transaction.', 'error');
        }
      });
    }
  }

  onSaveExpense(expenseData: any) {
    if (this.selectedExpense) {
      this.expenseService.updateExpense({ id: this.selectedExpense.id, ...expenseData });
      this.toastService.show('Expense Updated', 'Transaction details updated.', 'success');
    } else {
      const cat = this.categories.find(c => c.id == expenseData.categoryId);
      const fullExp = { ...expenseData, category: cat || { name: 'General', color: '#6366F1' } };
      this.expenseService.createExpense(fullExp).subscribe({
        next: () => {
          this.toastService.show('Expense Added', `Added ₹${expenseData.amount} transaction.`, 'success');
        },
        error: () => {
          this.toastService.show('Error', 'Failed to add transaction.', 'error');
        }
      });
    }
    this.closeModal();
  }
}
