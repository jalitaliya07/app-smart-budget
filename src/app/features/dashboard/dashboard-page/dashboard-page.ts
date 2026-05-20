import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense';
import { BudgetService } from '../../../core/services/budget';
import Chart from 'chart.js/auto';
import { Subscription } from 'rxjs';
import { BankService } from '../../../core/services/bank';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('expenseChart') expenseChart!: ElementRef;

  expenseService = inject(ExpenseService);
  budgetService = inject(BudgetService);
  bankService = inject(BankService);

  activeBanks: any[] = [];
  selectedBank = 'All';
  selectedPeriod = '6months';

  totalBalance = 0.00;
  monthlyExpense = 0.00;
  monthlyBudget = 0.00;
  savings = 0.00;

  bankMonthlyBudget = 0.00;
  cashMonthlyBudget = 0.00;
  bankMonthlyExpense = 0.00;
  cashMonthlyExpense = 0.00;
  bankBalance = 0.00;
  cashBalance = 0.00;

  recentTransactions: any[] = [];
  chartInstance: any;

  private sub1!: Subscription;
  private sub2!: Subscription;

  ngOnInit() {
    this.sub1 = this.expenseService.expenses$.subscribe(expenses => {
      this.calculateMetrics(expenses || [], this.budgetService.getCurrentBudgets() || []);
    });

    this.sub2 = this.budgetService.budgets$.subscribe(budgets => {
      this.calculateMetrics(this.expenseService.getCurrentExpenses() || [], budgets || []);
    });

    this.expenseService.loadExpenses().subscribe();
    this.budgetService.loadBudgets().subscribe();

    this.bankService.banks$.subscribe(banks => {
      this.activeBanks = banks || [];
    });
    this.bankService.loadBanks().subscribe();
  }

  onBankChange(bankName: string) {
    this.selectedBank = bankName;
    this.calculateMetrics(
      this.expenseService.getCurrentExpenses() || [],
      this.budgetService.getCurrentBudgets() || []
    );
  }

  onPeriodChange(period: string) {
    this.selectedPeriod = period;
    this.updateChartData(
      this.expenseService.getCurrentExpenses() || [],
      this.budgetService.getCurrentBudgets() || []
    );
  }

  ngAfterViewInit() {
    this.initChart();
    this.updateChartData(this.expenseService.getCurrentExpenses() || [], this.budgetService.getCurrentBudgets() || []);
  }

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.chartInstance) this.chartInstance.destroy();
  }

  calculateMetrics(expenses: any[], budgets: any[]) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Filter current month expenses
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.expenseDate || now);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear;
    });

    // Filter current month budgets
    const currentMonthBudgets = budgets.filter(b => {
      return (!b.month || b.month === currentMonth) && (!b.year || b.year === currentYear);
    });

    // 1. Calculate Total Monthly Expense
    this.monthlyExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 2. Calculate Total Monthly Budget
    this.monthlyBudget = budgets.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);

    // 3. Dynamic Total Balance & Savings
    if (this.monthlyBudget === 0 && this.monthlyExpense === 0) {
      this.totalBalance = 0.00;
      this.savings = 0.00;
    } else {
      this.totalBalance = Number((this.monthlyBudget > 0 ? Math.max(0, this.monthlyBudget - this.monthlyExpense) : 0).toFixed(2));
      this.savings = Number((this.monthlyBudget > 0 ? Math.max(0, this.monthlyBudget - this.monthlyExpense) : 0).toFixed(2));
    }

    // Bank & Cash Metrics
    if (this.selectedBank === 'All') {
      this.bankMonthlyBudget = budgets
        .filter(b => b.category?.name.toLowerCase() === 'bank')
        .reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);

      this.bankMonthlyExpense = expenses
        .filter(e => e.category?.name.toLowerCase() === 'bank' || (e.paymentMethod && e.paymentMethod.toLowerCase() !== 'cash'))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    } else {
      this.bankMonthlyBudget = budgets
        .filter(b => b.category?.name.toLowerCase() === 'bank' && b.bankName === this.selectedBank)
        .reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);

      this.bankMonthlyExpense = expenses
        .filter(e => e.paymentMethod && e.paymentMethod.toLowerCase().includes(this.selectedBank.toLowerCase()))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }

    this.cashMonthlyBudget = budgets
      .filter(b => b.category?.name.toLowerCase() === 'cash')
      .reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);

    this.cashMonthlyExpense = expenses
      .filter(e => e.category?.name.toLowerCase() === 'cash' || (e.paymentMethod && e.paymentMethod.toLowerCase() === 'cash'))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    this.bankBalance = Number((this.bankMonthlyBudget - this.bankMonthlyExpense).toFixed(2));
    this.cashBalance = Number((this.cashMonthlyBudget - this.cashMonthlyExpense).toFixed(2));

    // 4. Format Recent Transactions for UI
    this.recentTransactions = expenses.slice(0, 5).map((e, idx) => {
      const colors = ['text-emerald-500', 'text-indigo-500', 'text-rose-500', 'text-amber-500', 'text-cyan-500'];
      const bgs = ['bg-emerald-100', 'bg-indigo-100', 'bg-rose-100', 'bg-amber-100', 'bg-cyan-100'];
      const colorIdx = idx % colors.length;

      return {
        id: e.id,
        title: e.title || 'Transaction',
        amount: Number(e.amount || 0),
        category: e.category?.name ? [e.category.name] : ['General'],
        date: new Date(e.expenseDate || Date.now()),
        color: colors[colorIdx],
        bg: bgs[colorIdx]
      };
    });

    if (this.chartInstance) {
      this.updateChartData(expenses, budgets);
    }
  }

  initChart() {
    this.chartInstance = new Chart(this.expenseChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(new Date().getMonth() >= 5 ? new Date().getMonth() - 5 : 0, new Date().getMonth() + 1),
        datasets: [{
          label: 'Bank (₹)',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: '#6366f1',
          borderRadius: 6
        }, {
          label: 'Cash (₹)',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { display: true, color: '#f1f5f9' }
          },
          x: { grid: { display: false } }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  updateChartData(expenses: any[], budgets: any[]) {
    if (!this.chartInstance) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    let startMonthIndex = 0;
    let endMonthIndex = 11;
    let monthsCount = 12;

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let activeLabels = monthLabels;

    if (this.selectedPeriod === '6months') {
      startMonthIndex = Math.max(0, currentMonthIndex - 5);
      endMonthIndex = currentMonthIndex;
      monthsCount = endMonthIndex - startMonthIndex + 1;
      activeLabels = monthLabels.slice(startMonthIndex, endMonthIndex + 1);
    } else {
      startMonthIndex = 0;
      endMonthIndex = 11;
      monthsCount = 12;
      activeLabels = monthLabels;
    }

    const monthlyBankMap = new Array(monthsCount).fill(0);
    const monthlyCashMap = new Array(monthsCount).fill(0);

    expenses.forEach(e => {
      const d = new Date(e.expenseDate || now);
      if (d.getFullYear() === currentYear && d.getMonth() >= startMonthIndex && d.getMonth() <= endMonthIndex) {
        const idx = d.getMonth() - startMonthIndex;
        
        const isCash = e.category?.name.toLowerCase() === 'cash' || (e.paymentMethod && e.paymentMethod.toLowerCase() === 'cash');
        
        let isBank = false;
        if (this.selectedBank === 'All') {
          isBank = e.category?.name.toLowerCase() === 'bank' || (e.paymentMethod && e.paymentMethod.toLowerCase() !== 'cash');
        } else {
          isBank = !!(e.paymentMethod && e.paymentMethod.toLowerCase().includes(this.selectedBank.toLowerCase()));
        }

        if (isCash) {
          monthlyCashMap[idx] += Number(e.amount || 0);
        } else if (isBank) {
          monthlyBankMap[idx] += Number(e.amount || 0);
        }
      }
    });

    this.chartInstance.data.labels = activeLabels;
    this.chartInstance.data.datasets[0].data = monthlyBankMap.map(v => Math.round(v));
    this.chartInstance.data.datasets[1].data = monthlyCashMap.map(v => Math.round(v));
    this.chartInstance.update();
  }
}
