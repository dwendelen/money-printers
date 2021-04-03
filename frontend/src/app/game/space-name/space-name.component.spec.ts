import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceNameComponent } from './space-name.component';

describe('SpaceNameComponent', () => {
  let component: SpaceNameComponent;
  let fixture: ComponentFixture<SpaceNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpaceNameComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
