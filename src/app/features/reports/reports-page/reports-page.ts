import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../../core/services/expense';
import { BudgetService } from '../../../core/services/budget';
import { AuthService } from '../../../core/services/auth';
import Chart from 'chart.js/auto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reports-page',
  imports: [CommonModule],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.css',
})
export class ReportsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('expensePieChart') expensePieChart!: ElementRef;
  @ViewChild('spendingBarChart') spendingBarChart!: ElementRef;
  @ViewChild('savingsLineChart') savingsLineChart!: ElementRef;

  expenseService = inject(ExpenseService);
  budgetService = inject(BudgetService);
  authService = inject(AuthService);

  pieChartInstance: any;
  barChartInstance: any;
  lineChartInstance: any;

  // Header Data
  userName = 'User';
  reportPeriod = '';
  generatedDate = new Date();

  // Summary Data
  totalIncome = 0;
  totalExpenses = 0;
  totalBudget = 0;
  totalSavings = 0;

  // Extra Features Data
  financialHealthScore = 100; 
  topSpendingCategory = 'None';
  transactionCount = 0;

  // Expense List mapped for UI
  expenses: any[] = [];

  // Budget vs Spending list mapped for UI
  budgets: any[] = [];

  // Savings Analysis
  monthlySavings = 0;
  savingsRate = 0;
  emergencyFund = 0;
  investmentAmount = 0;

  private isViewInit = false;
  private sub1!: Subscription;
  private sub2!: Subscription;
  private subUser!: Subscription;

  ngOnInit() {
    // 1. Format report period to current Month and Year
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    this.reportPeriod = `${months[now.getMonth()]} ${now.getFullYear()}`;

    // 2. Subscribe to user details
    this.subUser = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.name || 'User';
      }
    });

    // 3. Subscribe to expenses and budgets
    this.sub1 = this.expenseService.expenses$.subscribe(expenses => {
      this.calculateMetrics(expenses || [], this.budgetService.getCurrentBudgets() || []);
      if (this.isViewInit) {
        this.updateCharts();
      }
    });

    this.sub2 = this.budgetService.budgets$.subscribe(budgets => {
      this.calculateMetrics(this.expenseService.getCurrentExpenses() || [], budgets || []);
      if (this.isViewInit) {
        this.updateCharts();
      }
    });

    this.expenseService.loadExpenses().subscribe();
    this.budgetService.loadBudgets().subscribe();
  }

  ngAfterViewInit() {
    this.isViewInit = true;
    this.updateCharts();
  }

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.subUser) this.subUser.unsubscribe();
    if (this.pieChartInstance) this.pieChartInstance.destroy();
    if (this.barChartInstance) this.barChartInstance.destroy();
    if (this.lineChartInstance) this.lineChartInstance.destroy();
  }

  calculateMetrics(expenses: any[], budgets: any[]) {
    // 1. Calculate Total Budget & Total Expenses
    this.totalBudget = budgets.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);
    this.totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 2. Set derived Income & Savings
    this.totalIncome = this.totalBudget; // Match allocated budget
    this.totalSavings = Math.max(0, this.totalBudget - this.totalExpenses);

    // 3. Calculate health score based on utilization
    if (this.totalBudget > 0) {
      this.financialHealthScore = Math.max(0, Math.min(100, Math.round(100 - (this.totalExpenses / this.totalBudget * 100))));
    } else {
      this.financialHealthScore = this.totalExpenses > 0 ? 0 : 100;
    }

    // 4. Calculate savings rate
    this.monthlySavings = this.totalSavings;
    if (this.totalBudget > 0) {
      this.savingsRate = Number((this.totalSavings / this.totalBudget * 100).toFixed(1));
    } else {
      this.savingsRate = 0;
    }

    // 5. Emergency Fund & Investments recommendation
    this.emergencyFund = this.totalSavings * 3;
    this.investmentAmount = Math.round(this.totalSavings * 0.4);

    // 6. Find top spending category & transaction count
    this.transactionCount = expenses.length;

    const categorySumMap: { [key: string]: number } = {};
    expenses.forEach(e => {
      const catName = e.category?.name || 'General';
      categorySumMap[catName] = (categorySumMap[catName] || 0) + Number(e.amount || 0);
    });

    let topCat = 'None';
    let topAmount = 0;
    for (const cat in categorySumMap) {
      if (categorySumMap[cat] > topAmount) {
        topAmount = categorySumMap[cat];
        topCat = cat;
      }
    }
    this.topSpendingCategory = topCat;

    // 7. Map expenses for detailed logs table
    this.expenses = expenses.map(e => {
      let emoji = '💸';
      const catName = e.category?.name?.toLowerCase() || '';
      if (catName.includes('food') || catName.includes('grocer')) emoji = '🍽️';
      else if (catName.includes('rent') || catName.includes('hous')) emoji = '🏠';
      else if (catName.includes('util') || catName.includes('bill')) emoji = '⚡';
      else if (catName.includes('entert')) emoji = '🍿';
      else if (catName.includes('travel') || catName.includes('trans')) emoji = '🚗';
      else if (catName.includes('shop')) emoji = '🛍️';
      else if (catName.includes('health') || catName.includes('medi')) emoji = '💊';
      else if (catName.includes('bank')) emoji = '🏦';
      else if (catName.includes('cash')) emoji = '💵';

      return {
        date: new Date(e.expenseDate || Date.now()),
        category: e.category?.name || 'General',
        description: e.title || 'Expense',
        paymentMethod: e.paymentMethod || 'UPI',
        amount: Number(e.amount || 0),
        status: 'Paid',
        icon: emoji,
        color: e.category?.color || '#6366f1'
      };
    });

    // 8. Map budgets for comparison table
    this.budgets = budgets.map(b => {
      const catName = b.category?.name || 'General';
      const spent = expenses
        .filter(e => e.categoryId === b.categoryId)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        category: catName,
        limit: Number(b.limitAmount || 0),
        spent: spent,
        color: b.category?.color || '#6366f1'
      };
    });
  }

  updateCharts() {
    if (!this.expensePieChart || !this.spendingBarChart || !this.savingsLineChart) return;

    // Group expenses by category for Pie chart
    const categoryGroup: { [key: string]: { amount: number; color: string } } = {};
    this.expenses.forEach(e => {
      if (!categoryGroup[e.category]) {
        categoryGroup[e.category] = { amount: 0, color: e.color || '#6366f1' };
      }
      categoryGroup[e.category].amount += e.amount;
    });

    const pieLabels = Object.keys(categoryGroup);
    const pieData = pieLabels.map(lbl => categoryGroup[lbl].amount);
    const pieColors = pieLabels.map(lbl => categoryGroup[lbl].color);

    if (this.pieChartInstance) this.pieChartInstance.destroy();
    this.pieChartInstance = new Chart(this.expensePieChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: pieLabels.length ? pieLabels : ['No Data'],
        datasets: [{
          data: pieData.length ? pieData : [1],
          backgroundColor: pieColors.length ? pieColors : ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }
      }
    });

    // Weekly spending trend
    const weeklyData = [0, 0, 0, 0];
    this.expenses.forEach(e => {
      const dateNum = e.date.getDate();
      if (dateNum <= 7) weeklyData[0] += e.amount;
      else if (dateNum <= 14) weeklyData[1] += e.amount;
      else if (dateNum <= 21) weeklyData[2] += e.amount;
      else weeklyData[3] += e.amount;
    });

    if (this.barChartInstance) this.barChartInstance.destroy();
    this.barChartInstance = new Chart(this.spendingBarChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4'],
        datasets: [{
          label: 'Spending (₹)',
          data: weeklyData,
          backgroundColor: '#6366f1',
          borderRadius: 4
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { display: true } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });

    // Savings line chart trend
    const currentSavings = this.totalSavings;
    const savingsTrend = [
      Math.round(currentSavings * 0.7),
      Math.round(currentSavings * 0.8),
      Math.round(currentSavings * 0.75),
      Math.round(currentSavings * 0.9),
      Math.round(currentSavings)
    ];

    if (this.lineChartInstance) this.lineChartInstance.destroy();
    this.lineChartInstance = new Chart(this.savingsLineChart.nativeElement, {
      type: 'line',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'Current'],
        datasets: [{
          label: 'Savings Trend (₹)',
          data: savingsTrend,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  exportPDF() {
    window.print();
  }
}
