import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingWizardComponent } from './booking-wizard.component';

describe('BookingWizardComponent', () => {
  let component: BookingWizardComponent;
  let fixture: ComponentFixture<BookingWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingWizardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
