import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyHousesComponent } from './buy-houses.component';

describe('BuyHousesComponent', () => {
  let component: BuyHousesComponent;
  let fixture: ComponentFixture<BuyHousesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyHousesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyHousesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
