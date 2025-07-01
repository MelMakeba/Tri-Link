import { Component, OnInit } from '@angular/core';
import { AdminDashboardService } from '../../../core/services/admin-dash.service';
import { CommonModule } from '@angular/common';
import { RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private adminService: AdminDashboardService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data: any) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  updateStatus(userId: string, isActive: boolean) {
    this.adminService.updateUserStatus(userId, isActive).subscribe(() => this.loadUsers());
  }

  changeRole(userId: string, role: string) {
    this.adminService.changeUserRole(userId, role).subscribe(() => this.loadUsers());
  }

  deleteUser(userId: string) {
    this.adminService.deleteUser(userId).subscribe(() => this.loadUsers());
  }

  onRoleChange(userId: string, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.changeRole(userId, value);
  }
}
