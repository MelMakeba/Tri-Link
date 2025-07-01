import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { BookingWizardComponent } from './components/booking-wizard/booking-wizard.component';
import { CarSelectionComponent } from './components/car-selection/car-selection.component';
import { DateTimeSelectionComponent } from './components/date-time-selection/date-time-selection.component';
import { CustomerDetailsComponent } from './components/customer-details/customer-details.component';
import { PaymentInformationComponent } from './components/payment-information/payment-information.component';
import { BookingConfirmationComponent } from './components/booking-confirmation/booking-confirmation.component';
import { SharedModule } from '../../../shared/shared.module';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: BookingWizardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] }
  }
];

@NgModule({
  declarations: [
    BookingWizardComponent,
    CarSelectionComponent,
    DateTimeSelectionComponent,
    CustomerDetailsComponent,
    PaymentInformationComponent,
    BookingConfirmationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class BookingsModule { }
