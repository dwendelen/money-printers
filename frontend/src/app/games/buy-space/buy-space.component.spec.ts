import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuySpaceComponent } from './buy-space.component';

describe('BuySpaceComponent', () => {
  let component: BuySpaceComponent;
  let fixture: ComponentFixture<BuySpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuySpaceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuySpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
