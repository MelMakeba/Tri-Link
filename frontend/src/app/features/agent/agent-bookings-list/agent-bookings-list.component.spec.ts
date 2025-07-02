import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentBookingsListComponent } from './agent-bookings-list.component';

describe('AgentBookingsListComponent', () => {
  let component: AgentBookingsListComponent;
  let fixture: ComponentFixture<AgentBookingsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentBookingsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentBookingsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
