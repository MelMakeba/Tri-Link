import { Injectable } from '@angular/core';
import { BookingWizardComponent } from '../../features/bookings/booking-wizard/booking-wizard.component';

@Injectable({
  providedIn: 'root'
})
export class BookingWizardService {
  private wizardComponentRef: BookingWizardComponent | null = null;

  setWizardComponentReference(component: BookingWizardComponent): void {
    this.wizardComponentRef = component;
  }

  getWizardComponentReference(): BookingWizardComponent | null {
    return this.wizardComponentRef;
  }
}