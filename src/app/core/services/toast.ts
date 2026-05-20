import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    const id = Date.now();
    const current = this.toastsSubject.value;
    const newToast: ToastMessage = { id, title, message, type };
    
    this.toastsSubject.next([newToast, ...current]);

    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  remove(id: number) {
    const current = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(current);
  }
}
