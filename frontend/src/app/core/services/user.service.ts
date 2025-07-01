import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Initialize with data from localStorage or API
    this.loadCurrentUser();
  }

  // Get current user value
  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  // Load user from storage/API
  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // Update user data
  updateUser(userData: any): void {
    const currentUser = this.currentUserValue;
    const updatedUser = { ...currentUser, ...userData };
    
    this.currentUserSubject.next(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }

  // Update profile image specifically
  updateProfileImage(newAvatarUrl: string): void {
    const currentUser = this.currentUserValue;
    if (currentUser) {
      currentUser.avatar = newAvatarUrl;
      this.updateUser(currentUser);
    }
  }

  // Set complete user data
  setUser(userData: any): void {
    this.currentUserSubject.next(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  }

  // Clear user data
  clearUser(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }
}
