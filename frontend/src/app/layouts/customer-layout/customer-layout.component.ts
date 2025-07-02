import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="customer-layout">
      <header class="customer-header">
        <!-- Header content here -->
      </header>
      
      <main class="customer-content">
        <!-- This is where child routes will be rendered -->
        <router-outlet></router-outlet>
      </main>
      
      <footer class="customer-footer">
        <!-- Footer content here -->
      </footer>
    </div>
  `,
  styles: [`
    .customer-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .customer-content {
      flex: 1;
      padding: 20px;
    }
  `]
})
export class CustomerLayoutComponent {}
