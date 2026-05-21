import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Workspace {
  id: string;
  name: string;
  emoji: string;
  keywords: string[];
  isCustom?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContextService {
  private defaultWorkspaces: Workspace[] = [
    {
      id: 'Personal',
      name: 'Personal Workspace',
      emoji: '👤',
      keywords: ['personal', 'self', 'shopping', 'entertainment', 'netflix', 'spotify', 'movie', 'gift', 'salon', 'gym', 'hobby', 'clothing', 'apparel', 'dining', 'restaurant', 'food', 'snack', 'cafe', 'game', 'subscription', 'haircut']
    },
    {
      id: 'Home',
      name: 'Home Workspace',
      emoji: '🏠',
      keywords: ['home', 'rent', 'house', 'electricity', 'water', 'gas', 'grocery', 'bills', 'internet', 'broadband', 'family', 'maid', 'furniture', 'appliance', 'kitchen', 'repair']
    },
    {
      id: 'Company',
      name: 'Company Workspace',
      emoji: '🏢',
      keywords: ['company', 'work', 'office', 'business', 'job', 'corp', 'tax', 'firm', 'salary', 'project', 'client', 'sponsorship', 'invoice', 'corporate', 'meeting']
    }
  ];

  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  public workspaces$ = this.workspacesSubject.asObservable();

  private contextSubject = new BehaviorSubject<string>('All');
  public context$ = this.contextSubject.asObservable();

  constructor() {
    this.loadWorkspaces();
  }

  private loadWorkspaces() {
    const saved = localStorage.getItem('custom_workspaces');
    let custom: Workspace[] = [];
    if (saved) {
      try {
        custom = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing custom workspaces', e);
      }
    }
    this.workspacesSubject.next([...this.defaultWorkspaces, ...custom]);
  }

  getWorkspaces(): Workspace[] {
    return this.workspacesSubject.value;
  }

  addWorkspace(workspace: Omit<Workspace, 'isCustom'>) {
    const custom = this.getCustomWorkspaces();
    const newWs: Workspace = { ...workspace, isCustom: true };
    custom.push(newWs);
    localStorage.setItem('custom_workspaces', JSON.stringify(custom));
    this.loadWorkspaces();
  }

  updateWorkspace(id: string, updated: Omit<Workspace, 'id' | 'isCustom'>) {
    const custom = this.getCustomWorkspaces();
    const idx = custom.findIndex(w => w.id === id);
    if (idx !== -1) {
      custom[idx] = { ...custom[idx], ...updated };
      localStorage.setItem('custom_workspaces', JSON.stringify(custom));
      this.loadWorkspaces();
    }
  }

  deleteWorkspace(id: string) {
    let custom = this.getCustomWorkspaces();
    custom = custom.filter(w => w.id !== id);
    localStorage.setItem('custom_workspaces', JSON.stringify(custom));
    this.loadWorkspaces();
    
    // If the active context was the deleted workspace, switch to All
    if (this.getCurrentContext() === id) {
      this.setContext('All');
    }
  }

  private getCustomWorkspaces(): Workspace[] {
    const saved = localStorage.getItem('custom_workspaces');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  setContext(context: string) {
    this.contextSubject.next(context);
  }

  getCurrentContext(): string {
    return this.contextSubject.value;
  }

  // A helper function to filter items dynamically based on the current context keywords
  filterItem(item: any, context: string): boolean {
    if (!context || context === 'All') return true;

    const title = (item.title || item.description || '').toLowerCase();
    const categoryName = (item.category?.name || item.category || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    const target = `${title} ${categoryName} ${notes}`;

    const workspaces = this.getWorkspaces();
    const activeWorkspace = workspaces.find(w => w.id === context);
    if (!activeWorkspace) return true;

    // For default personal workspace, we keep the original fallback logic (non-matching company and home)
    if (context === 'Personal') {
      const isCompany = this.defaultWorkspaces.find(w => w.id === 'Company')?.keywords.some(k => target.includes(k));
      const isHome = this.defaultWorkspaces.find(w => w.id === 'Home')?.keywords.some(k => target.includes(k));
      return activeWorkspace.keywords.some(k => target.includes(k)) || (!isCompany && !isHome);
    }

    return activeWorkspace.keywords.some(k => target.includes(k));
  }
}
