import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { BookingWizardComponent } from '../bookings/booking-wizard/booking-wizard.component';
import { CarSelectionComponent } from '../bookings/car-selection/car-selection.component';
import { DateTimeSelectionComponent } from '../bookings/date-time-selection/date-time-selection.component';
import { CustomerDetailsComponent } from '../bookings/customer-details/customer-details.component';
import { PaymentInformationComponent } from '../bookings/payment-information/payment-information.component';
import { BookingConfirmationComponent } from '../bookings/booking-confirmation/booking-confirmation.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: BookingWizardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    BookingWizardComponent,
    CarSelectionComponent,
    DateTimeSelectionComponent,
    CustomerDetailsComponent,
    PaymentInformationComponent,
    BookingConfirmationComponent
  ]
})
export class BookingsModule { }
