import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContextService {
  private contextSubject = new BehaviorSubject<string>('All');
  public context$ = this.contextSubject.asObservable();

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

    if (context === 'Company') {
      const keywords = ['company', 'work', 'office', 'business', 'job', 'corp', 'tax', 'firm', 'salary', 'project', 'client', 'sponsorship', 'invoice', 'corporate', 'meeting'];
      return keywords.some(k => target.includes(k));
    }

    if (context === 'Home') {
      const keywords = ['home', 'rent', 'house', 'electricity', 'water', 'gas', 'grocery', 'bills', 'internet', 'broadband', 'family', 'maid', 'furniture', 'appliance', 'kitchen', 'repair'];
      return keywords.some(k => target.includes(k));
    }

    if (context === 'Personal') {
      const keywords = ['personal', 'self', 'shopping', 'entertainment', 'netflix', 'spotify', 'movie', 'gift', 'salon', 'gym', 'hobby', 'clothing', 'apparel', 'dining', 'restaurant', 'food', 'snack', 'cafe', 'game', 'subscription', 'haircut'];
      // Fallback: If it's not Company and not Home, count it as Personal
      const isCompany = ['company', 'work', 'office', 'business', 'job', 'corp', 'tax', 'firm', 'salary', 'project', 'client', 'sponsorship', 'invoice', 'corporate', 'meeting'].some(k => target.includes(k));
      const isHome = ['home', 'rent', 'house', 'electricity', 'water', 'gas', 'grocery', 'bills', 'internet', 'broadband', 'family', 'maid', 'furniture', 'appliance', 'kitchen', 'repair'].some(k => target.includes(k));
      return keywords.some(k => target.includes(k)) || (!isCompany && !isHome);
    }

    return true;
  }
}
