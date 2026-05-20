import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AIInsightsService {
  analyzeSpending(expenses: any[], budgets: any[]): any {
    if (!expenses.length) {
      return {
        summary: "Not enough data for AI analysis. Add more expenses to receive smart recommendations.",
        savingPotential: 0,
        topCategory: "None",
        recommendations: []
      };
    }

    const categoryMap: { [key: string]: number } = {};
    let totalSpent = 0;

    expenses.forEach(e => {
      const catName = e.category?.name || 'General';
      categoryMap[catName] = (categoryMap[catName] || 0) + e.amount;
      totalSpent += e.amount;
    });

    let topCat = "General";
    let topCatAmount = 0;
    for (const cat in categoryMap) {
      if (categoryMap[cat] > topCatAmount) {
        topCatAmount = categoryMap[cat];
        topCat = cat;
      }
    }

    const savingPotential = Math.round(totalSpent * 0.15);

    return {
      summary: `Your top spending category is ${topCat} (₹${topCatAmount.toFixed(2)}). An AI-optimized budget reallocation could save you approximately ₹${savingPotential.toFixed(2)} monthly.`,
      savingPotential,
      topCategory: topCat,
      recommendations: [
        `Consider finding a cheaper alternative or negotiating recurring bills in ${topCat}.`,
        `Set up an automated monthly transfer of ₹${Math.round(savingPotential / 2)} into your savings account immediately after payday.`,
        `Review unused subscriptions tagged under Utilities or SaaS.`
      ]
    };
  }
}
