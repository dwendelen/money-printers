import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyThisSpaceComponent } from './buy-this-space.component';

describe('BuyThisSpaceComponent', () => {
  let component: BuyThisSpaceComponent;
  let fixture: ComponentFixture<BuyThisSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyThisSpaceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyThisSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
