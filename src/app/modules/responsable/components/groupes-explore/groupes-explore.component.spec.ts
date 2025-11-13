import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupesExploreComponent } from './groupes-explore.component';

describe('GroupesExploreComponent', () => {
  let component: GroupesExploreComponent;
  let fixture: ComponentFixture<GroupesExploreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupesExploreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupesExploreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
