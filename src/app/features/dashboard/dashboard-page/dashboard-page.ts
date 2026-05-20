import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense';
import { BudgetService } from '../../../core/services/budget';
import Chart from 'chart.js/auto';
import { Subscription } from 'rxjs';
import { BankService } from '../../../core/services/bank';
import { ContextService } from '../../../core/services/context';
import { AuthService } from '../../../core/services/auth';

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
  contextService = inject(ContextService);
  authService = inject(AuthService);

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

  // Premium dashboard properties
  userName = 'User';
  greetingMessage = 'Welcome back';
  currentMonthYearName = '';
  aiInsightMessage = 'Calculating insights...';

  private sub1!: Subscription;
  private sub2!: Subscription;
  private sub3!: Subscription;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.userName = user?.name || 'User';
    });

    const hour = new Date().getHours();
    if (hour < 12) this.greetingMessage = 'Good morning';
    else if (hour < 17) this.greetingMessage = 'Good afternoon';
    else this.greetingMessage = 'Good evening';

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.currentMonthYearName = `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;

    this.sub1 = this.expenseService.expenses$.subscribe(expenses => {
      this.calculateMetrics(expenses || [], this.budgetService.getCurrentBudgets() || []);
    });

    this.sub2 = this.budgetService.budgets$.subscribe(budgets => {
      this.calculateMetrics(this.expenseService.getCurrentExpenses() || [], budgets || []);
    });

    this.sub3 = this.contextService.context$.subscribe(() => {
      this.calculateMetrics(
        this.expenseService.getCurrentExpenses() || [],
        this.budgetService.getCurrentBudgets() || []
      );
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
    if (this.sub3) this.sub3.unsubscribe();
    if (this.chartInstance) this.chartInstance.destroy();
  }

  calculateMetrics(rawExpenses: any[], rawBudgets: any[]) {
    const context = this.contextService.getCurrentContext();
    const expenses = rawExpenses.filter(e => this.contextService.filterItem(e, context));
    const budgets = rawBudgets.filter(b => this.contextService.filterItem(b, context));

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

    // Dynamic AI insights
    if (this.monthlyBudget > 0) {
      const ratio = this.monthlyExpense / this.monthlyBudget;
      if (ratio > 0.9) {
        this.aiInsightMessage = 'Spent over 90% of budget. We recommend limiting non-essential category purchases.';
      } else if (ratio > 0.7) {
        this.aiInsightMessage = 'Spending is at 70% of budget. Keep an eye on secondary subscriptions.';
      } else {
        this.aiInsightMessage = 'Your monthly spending rate is fully on track. Great job!';
      }
    } else {
      this.aiInsightMessage = 'Set category budgets to unlock personalized AI savings suggestions.';
    }

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
    const canvas = this.expenseChart.nativeElement;
    const ctx = canvas.getContext('2d');
    
    // Create gradient colors
    const bankGradient = ctx.createLinearGradient(0, 0, 0, 300);
    bankGradient.addColorStop(0, 'rgba(99, 102, 241, 0.95)'); // Indigo
    bankGradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)'); // Purple
    
    const cashGradient = ctx.createLinearGradient(0, 0, 0, 300);
    cashGradient.addColorStop(0, 'rgba(16, 185, 129, 0.95)'); // Emerald
    cashGradient.addColorStop(1, 'rgba(6, 182, 212, 0.4)');  // Cyan

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(new Date().getMonth() >= 5 ? new Date().getMonth() - 5 : 0, new Date().getMonth() + 1),
        datasets: [{
          label: 'Bank (₹)',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: bankGradient,
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: '#6366f1'
        }, {
          label: 'Cash (₹)',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: cashGradient,
          borderColor: '#10b981',
          borderWidth: 1.5,
          borderRadius: 8,
          hoverBackgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { display: true, color: 'rgba(241, 245, 249, 0.4)' },
            ticks: { color: '#64748b', font: { weight: 'bold' } }
          },
          x: { 
            grid: { display: false },
            ticks: { color: '#64748b', font: { weight: 'bold' } }
          }
        },
        plugins: { 
          legend: { 
            position: 'top',
            labels: {
              color: '#334155',
              font: { weight: 'bold', size: 12 }
            }
          } 
        }
      }
    });
  }

  updateChartData(rawExpenses: any[], rawBudgets: any[]) {
    if (!this.chartInstance) return;

    const context = this.contextService.getCurrentContext();
    const expenses = rawExpenses.filter(e => this.contextService.filterItem(e, context));
    const budgets = rawBudgets.filter(b => this.contextService.filterItem(b, context));

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
