import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

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

  pieChartInstance: any;
  barChartInstance: any;
  lineChartInstance: any;

  // Header Data
  userName = 'John Doe';
  reportPeriod = 'May 2026';
  generatedDate = new Date();

  // Summary Data
  totalIncome = 85000;
  totalExpenses = 52450;
  totalBudget = 60000;
  totalSavings = 32550;

  // Extra Features Data
  financialHealthScore = 85; 
  topSpendingCategory = 'Housing';
  transactionCount = 42;

  // Expense Table Data (12 entries)
  expenses = [
    { date: new Date(2026, 4, 2), category: 'Housing', description: 'Monthly Rent', paymentMethod: 'Bank Transfer', amount: 18000, status: 'Paid', icon: '🏠', color: 'bg-indigo-100 text-indigo-600' },
    { date: new Date(2026, 4, 3), category: 'Groceries', description: 'Supermarket Shopping', paymentMethod: 'Credit Card', amount: 4500, status: 'Paid', icon: '🛒', color: 'bg-emerald-100 text-emerald-600' },
    { date: new Date(2026, 4, 5), category: 'Entertainment', description: 'Netflix Subscription', paymentMethod: 'Credit Card', amount: 649, status: 'Paid', icon: '🍿', color: 'bg-purple-100 text-purple-600' },
    { date: new Date(2026, 4, 8), category: 'Bills', description: 'Electricity Bill', paymentMethod: 'UPI', amount: 2100, status: 'Paid', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
    { date: new Date(2026, 4, 10), category: 'Transport', description: 'Petrol', paymentMethod: 'Debit Card', amount: 3000, status: 'Paid', icon: '⛽', color: 'bg-gray-100 text-gray-600' },
    { date: new Date(2026, 4, 12), category: 'Food', description: 'Restaurant Dinner', paymentMethod: 'Credit Card', amount: 2500, status: 'Paid', icon: '🍽️', color: 'bg-orange-100 text-orange-600' },
    { date: new Date(2026, 4, 15), category: 'Bills', description: 'Internet Broadband', paymentMethod: 'UPI', amount: 999, status: 'Paid', icon: '🌐', color: 'bg-cyan-100 text-cyan-600' },
    { date: new Date(2026, 4, 18), category: 'Shopping', description: 'Amazon Order', paymentMethod: 'Credit Card', amount: 5400, status: 'Paid', icon: '🛍️', color: 'bg-pink-100 text-pink-600' },
    { date: new Date(2026, 4, 20), category: 'EMI', description: 'Car Loan EMI', paymentMethod: 'Auto Debit', amount: 8500, status: 'Paid', icon: '🚗', color: 'bg-blue-100 text-blue-600' },
    { date: new Date(2026, 4, 22), category: 'Healthcare', description: 'Pharmacy', paymentMethod: 'Cash', amount: 1200, status: 'Paid', icon: '💊', color: 'bg-red-100 text-red-600' },
    { date: new Date(2026, 4, 25), category: 'Transport', description: 'Flight Booking', paymentMethod: 'Credit Card', amount: 4200, status: 'Pending', icon: '✈️', color: 'bg-sky-100 text-sky-600' },
    { date: new Date(2026, 4, 28), category: 'Bills', description: 'Mobile Recharge', paymentMethod: 'UPI', amount: 1402, status: 'Paid', icon: '📱', color: 'bg-teal-100 text-teal-600' }
  ];

  // Budget Analysis
  budgets = [
    { category: 'Housing & Bills', limit: 25000, spent: 22501, color: 'bg-indigo-500' },
    { category: 'Food & Groceries', limit: 9000, spent: 7000, color: 'bg-emerald-500' },
    { category: 'Transport', limit: 8000, spent: 7200, color: 'bg-cyan-500' },
    { category: 'EMI', limit: 10000, spent: 8500, color: 'bg-blue-500' },
    { category: 'Shopping', limit: 6000, spent: 5400, color: 'bg-pink-500' },
    { category: 'Healthcare', limit: 2000, spent: 1200, color: 'bg-rose-500' }
  ];

  // Savings Analysis
  monthlySavings = 32550;
  savingsRate = 38.3; // %
  emergencyFund = 150000;
  investmentAmount = 20000;

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnDestroy() {
    if (this.pieChartInstance) this.pieChartInstance.destroy();
    if (this.barChartInstance) this.barChartInstance.destroy();
    if (this.lineChartInstance) this.lineChartInstance.destroy();
  }

  initCharts() {
    const commonOptions = {
      animation: false, // Important for printing
      responsive: true,
      maintainAspectRatio: false,
    };

    // Pie Chart
    this.pieChartInstance = new Chart(this.expensePieChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Housing', 'Food', 'Transport', 'EMI', 'Shopping', 'Other'],
        datasets: [{
          data: [22501, 7000, 7200, 8500, 5400, 1849],
          backgroundColor: ['#6366f1', '#10b981', '#06b6d4', '#3b82f6', '#ec4899', '#f43f5e'],
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

    // Bar Chart
    this.barChartInstance = new Chart(this.spendingBarChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4'],
        datasets: [{
          label: 'Spending (₹)',
          data: [15000, 12450, 18000, 7000],
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

    // Line Chart
    this.lineChartInstance = new Chart(this.savingsLineChart.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Savings Trend (₹)',
          data: [28000, 29500, 31000, 30500, 32550],
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

