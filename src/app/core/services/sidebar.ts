import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  toggle() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  setOpen(isOpen: boolean) {
    this.isOpenSubject.next(isOpen);
  }

  isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}
