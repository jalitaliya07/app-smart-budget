import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { ExpenseList } from './features/expenses/expense-list/expense-list';
import { BudgetList } from './features/budgets/budget-list/budget-list';
import { ReportsPage } from './features/reports/reports-page/reports-page';
import { SettingsPage } from './features/settings/settings-page/settings-page';
import { BankList } from './features/banks/bank-list/bank-list';
import { CategoryList } from './features/categories/category-list/category-list';
import { UserManagementPage } from './features/admin/user-management/user-management';
import { authGuard } from './core/guards/auth.guard';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'expenses', component: ExpenseList },
      { path: 'budgets', component: BudgetList },
      { path: 'reports', component: ReportsPage },
      { path: 'settings', component: SettingsPage },
      { path: 'banks', component: BankList },
      { path: 'categories', component: CategoryList },
      { path: 'users', component: UserManagementPage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
