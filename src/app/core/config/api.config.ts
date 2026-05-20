import { isDevMode } from '@angular/core';

// Change the production URL to your actual deployed backend URL (e.g. Render, Railway, Vercel)
export const API_BASE_URL = isDevMode()
  ? 'http://localhost:3000'
  : 'https://api-smart-budget.onrender.com';
