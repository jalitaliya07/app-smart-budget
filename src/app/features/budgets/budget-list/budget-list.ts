import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../../core/services/budget';
import { CategoryService } from '../../../core/services/category';
import { ExpenseService } from '../../../core/services/expense';
import { ToastService } from '../../../core/services/toast';
import { BankService } from '../../../core/services/bank';

@Component({
  selector: 'app-budget-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.css',
})
export class BudgetList implements OnInit {
  budgetService = inject(BudgetService);
  categoryService = inject(CategoryService);
  expenseService = inject(ExpenseService);
  toastService = inject(ToastService);
  bankService = inject(BankService);

  budgets: any[] = [];
  categories: any[] = [];

  isAddOpen = false;
  editingBudgetId: number | null = null;
  newBudget = { categoryId: '', limitAmount: '', bankName: '' };

  banks: any[] = [];

  get totalMonthlyBudget(): number {
    return this.budgets.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);
  }

  get bankAndCashCategories(): any[] {
    return this.categories.filter(c => c.name.toLowerCase() === 'bank' || c.name.toLowerCase() === 'cash');
  }

  get isBankSelected(): boolean {
    const selectedCat = this.categories.find(c => c.id == this.newBudget.categoryId);
    return selectedCat?.name.toLowerCase() === 'bank';
  }

  ngOnInit() {
    this.budgetService.budgets$.subscribe(data => {
      this.budgets = data || [];
      this.updateSpentAmounts();
    });

    this.expenseService.expenses$.subscribe(() => {
      this.updateSpentAmounts();
    });

    this.budgetService.loadBudgets().subscribe();
    this.expenseService.loadExpenses().subscribe();

    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        const filtered = this.bankAndCashCategories;
        if (filtered.length > 0) {
          this.newBudget.categoryId = filtered[0].id;
        }
      },
      error: () => {
        this.categories = [];
      }
    });

    this.bankService.loadBanks().subscribe(banks => {
      this.banks = banks || [];
      if (this.banks.length > 0) {
        this.newBudget.bankName = this.banks[0].name;
      }
    });
  }

  updateSpentAmounts() {
    const expenses = this.expenseService.getCurrentExpenses() || [];
    this.budgets = this.budgets.map(b => {
      const matching = expenses.filter(e => e.categoryId == b.categoryId);
      const spent = matching.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      return { ...b, currentSpent: spent };
    });
    this.checkOverspending();
  }

  checkOverspending() {
    this.budgets.forEach(b => {
      if (b.currentSpent > b.limitAmount) {
        this.toastService.show(
          'Budget Exceeded!',
          `You have overspent your ${b.category?.name || 'Category'} budget by ₹${(b.currentSpent - b.limitAmount).toFixed(2)}.`,
          'error'
        );
      } else if (b.currentSpent > 0 && b.currentSpent / b.limitAmount > 0.8) {
        this.toastService.show(
          'Budget Warning',
          `You have used over 80% of your ${b.category?.name || 'Category'} budget.`,
          'warning'
        );
      }
    });
  }

  getPercentage(current: number, limit: number): number {
    if (!limit || limit === 0) return 0;
    const pct = (current / limit) * 100;
    return pct > 100 ? 100 : Math.round(pct);
  }

  openAddModal() {
    this.editingBudgetId = null;
    this.newBudget = { 
      categoryId: this.bankAndCashCategories[0]?.id || '', 
      limitAmount: '', 
      bankName: this.banks[0]?.name || '' 
    };
    this.isAddOpen = true;
  }

  openEditModal(budget: any) {
    this.editingBudgetId = budget.id;
    this.newBudget = {
      categoryId: budget.categoryId.toString(),
      limitAmount: budget.limitAmount.toString(),
      bankName: budget.bankName || ''
    };
    this.isAddOpen = true;
  }

  deleteBudget(id: number) {
    if (confirm('Are you sure you want to delete this budget limit?')) {
      this.budgetService.deleteBudget(id).subscribe({
        next: () => {
          this.toastService.show('Budget Deleted', 'Category budget has been removed.', 'success');
        },
        error: () => {
          this.toastService.show('Error', 'Failed to delete budget.', 'error');
        }
      });
    }
  }

  saveBudget() {
    if (!this.newBudget.categoryId || !this.newBudget.limitAmount) return;

    const payload: any = {
      categoryId: parseInt(this.newBudget.categoryId),
      limitAmount: parseFloat(this.newBudget.limitAmount),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };

    if (this.isBankSelected) {
      payload.bankName = this.newBudget.bankName;
    } else {
      payload.bankName = null;
    }

    const cat = this.categories.find(c => c.id == this.newBudget.categoryId);

    if (this.editingBudgetId) {
      this.budgetService.updateBudget(this.editingBudgetId, payload).subscribe({
        next: () => {
          this.toastService.show('Budget Updated', `Successfully updated budget for ${cat?.name || 'Category'}.`, 'success');
          this.isAddOpen = false;
          this.editingBudgetId = null;
        },
        error: () => {
          this.toastService.show('Error', 'Failed to update budget.', 'error');
        }
      });
    } else {
      this.budgetService.createBudget(payload, cat).subscribe({
        next: () => {
          this.toastService.show('Budget Set', `Successfully set budget for ${cat?.name || 'Category'}.`, 'success');
          this.isAddOpen = false;
        },
        error: () => {
          this.toastService.show('Error', 'Failed to set budget.', 'error');
        }
      });
    }
  }
}
