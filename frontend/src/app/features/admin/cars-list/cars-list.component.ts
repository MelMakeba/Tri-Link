import { Component, OnInit } from '@angular/core';
import { AdminDashboardService } from '../../../core/services/admin-dash.service';
import { CommonModule } from '@angular/common';
import { RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'app-cars-list',
  imports: [CommonModule, RouterModule, RouterLinkActive],
  templateUrl: './cars-list.component.html',
  styleUrl: './cars-list.component.css'
})
export class CarsListComponent implements OnInit {
  cars: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private adminService: AdminDashboardService) {}

  ngOnInit() {
    this.loadCars();
  }

  loadCars() {
    this.isLoading = true;
    this.adminService.getAllCars().subscribe({
      next: (data: any) => {
        this.cars = data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load cars';
        this.isLoading = false;
      }
    });
  }

}
