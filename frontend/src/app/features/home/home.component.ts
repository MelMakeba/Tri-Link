import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../core/models/user.model'; 
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { AgentVehicleService } from '../../core/services/vehicle.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: User | null;
  featuredVehicles: any[] = [];
  isLoading = false;
  
  // Quick search form
  searchForm: FormGroup;
  
  // Testimonials with animation
  testimonials = [
    { 
      id: 1, 
      name: 'Sarah Johnson', 
      image: 'assets/images/testimonials/user1.jpg',
      comment: 'Tri-Link made my vacation perfect! The car was spotless and the booking process was so simple.',
      rating: 5
    },
    { 
      id: 2, 
      name: 'Michael Chen', 
      image: 'assets/images/testimonials/user2.jpg',
      comment: 'As a business traveler, I appreciate the efficiency and quality of service. Will definitely use again!',
      rating: 4
    },
    { 
      id: 3, 
      name: 'Emma Williams', 
      image: 'assets/images/testimonials/user3.jpg',
      comment: 'The best car rental experience I\'ve had. The staff was helpful and the vehicle was perfect for our trip.',
      rating: 5
    }
  ];
  activeTestimonial = 0;
  
  // Stats counters
  stats = [
    { value: 0, target: 5000, label: 'Happy Customers', icon: 'people' },
    { value: 0, target: 300, label: 'Quality Vehicles', icon: 'directions_car' },
    { value: 0, target: 50, label: 'Locations', icon: 'location_on' },
    { value: 0, target: 99, label: 'Satisfaction Rate', icon: 'thumb_up', suffix: '%' }
  ];
  
  // FAQ accordion
  faqs = [
    { 
      question: 'How do I book a vehicle?', 
      answer: 'You can book a vehicle by using our search tool, selecting your dates, and following the booking process. You\'ll need to create an account if you don\'t have one already.',
      isOpen: false
    },
    { 
      question: 'What documents do I need to rent a car?', 
      answer: 'You\'ll need a valid driver\'s license, a credit card in your name, and proof of insurance. International renters may need additional documentation.',
      isOpen: false
    },
    { 
      question: 'Can I modify or cancel my booking?', 
      answer: 'Yes, you can modify or cancel your booking through your account dashboard. Please note that cancellation policies vary based on the booking type.',
      isOpen: false
    },
    { 
      question: 'Is there a security deposit required?', 
      answer: 'Yes, a security deposit is typically held on your credit card during the rental period. The amount varies based on the vehicle type.',
      isOpen: false
    }
  ];
  
  // Newsletter subscription
  newsletterEmail: string = '';
  isSubscribing = false;

  constructor(
    private authService: AuthService, 
    public router: Router,
    private fb: FormBuilder,
    private vehicleService: AgentVehicleService,
    private notification: NotificationService
  ) {
    this.user = this.authService.getCurrentUser();
    this.searchForm = this.fb.group({
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFeaturedVehicles();
    this.animateStats();
  }

  loadFeaturedVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (response) => {
        this.featuredVehicles = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  searchVehicles(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    
    const searchData = this.searchForm.value;
    this.router.navigate(['/vehicles/search'], { 
      queryParams: { 
        location: searchData.location,
        startDate: searchData.startDate,
        endDate: searchData.endDate
      } 
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
  
  nextTestimonial(): void {
    this.activeTestimonial = (this.activeTestimonial + 1) % this.testimonials.length;
  }
  
  prevTestimonial(): void {
    this.activeTestimonial = (this.activeTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
  }
  
  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
  
  subscribeNewsletter(): void {
    if (!this.newsletterEmail || !this.validateEmail(this.newsletterEmail)) {
      this.notification.error('Please enter a valid email address');
      return;
    }
    
    this.isSubscribing = true;
    
    // Simulate API call
    setTimeout(() => {
      this.notification.success('Thank you for subscribing to our newsletter!');
      this.newsletterEmail = '';
      this.isSubscribing = false;
    }, 1000);
  }
  
  validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }
  
  private animateStats(): void {
    const duration = 2000; // 2 seconds
    const steps = 50;
    const interval = duration / steps;
    
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      this.stats.forEach(stat => {
        stat.value = Math.floor(progress * stat.target);
      });
      
      if (step === steps) {
        clearInterval(timer);
      }
    }, interval);
  }
}
