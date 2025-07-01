import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarSelectionComponent } from './car-selection.component';

describe('CarSelectionComponent', () => {
  let component: CarSelectionComponent;
  let fixture: ComponentFixture<CarSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
