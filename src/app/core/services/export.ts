import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportToCSV(data: any[], filename: string = 'expenses_report.csv') {
    if (!data || !data.length) return;

    const headers = ['Title', 'Category', 'Amount', 'Payment Method', 'Date', 'Notes'];
    const rows = data.map(e => [
      `"${e.title}"`,
      `"${e.category?.name || 'General'}"`,
      e.amount,
      `"${e.paymentMethod}"`,
      `"${new Date(e.expenseDate).toLocaleDateString()}"`,
      `"${e.notes || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportBillToCSV(
    userName: string,
    monthName: string,
    year: number,
    totals: { totalBudget: number; totalExpense: number; totalSavings: number },
    categorySummaries: any[],
    transactions: any[],
    filename: string = 'financial_statement_bill.csv'
  ) {
    const csvLines: string[] = [];

    // Header section
    csvLines.push('SmartBudget Pro - Financial Statement Bill');
    csvLines.push(`User Name,${userName}`);
    csvLines.push(`Statement Period,${monthName} ${year}`);
    csvLines.push(`Generated Date,${new Date().toLocaleDateString()}`);
    csvLines.push('');

    // Summary Section
    csvLines.push('SUMMARY METRICS');
    csvLines.push(`Total Budget,₹${totals.totalBudget.toFixed(2)}`);
    csvLines.push(`Total Expenses,₹${totals.totalExpense.toFixed(2)}`);
    csvLines.push(`Total Savings,₹${totals.totalSavings.toFixed(2)}`);
    csvLines.push('');

    // Category Breakdown Section
    csvLines.push('CATEGORY-WISE SUMMARY');
    csvLines.push('Category,Budget Limit,Actual Spent,Savings / Deficit,Status');
    categorySummaries.forEach(cat => {
      csvLines.push(`"${cat.name}",₹${cat.budget.toFixed(2)},₹${cat.expense.toFixed(2)},₹${cat.savings.toFixed(2)},"${cat.status}"`);
    });
    csvLines.push('');

    // Transactions Section
    csvLines.push('MONTHLY TRANSACTION LOG');
    csvLines.push('Date,Description,Category,Payment Method,Amount');
    transactions.forEach(t => {
      const dateStr = new Date(t.expenseDate).toLocaleDateString();
      const catName = t.category?.name || 'General';
      const amountVal = Number(t.amount || 0).toFixed(2);
      csvLines.push(`"${dateStr}","${t.title}","${catName}","${t.paymentMethod}",₹${amountVal}`);
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToPDF() {
    window.print();
  }
}
