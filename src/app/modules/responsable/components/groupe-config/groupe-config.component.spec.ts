import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupeConfigComponent } from './groupe-config.component';

describe('GroupeConfigComponent', () => {
  let component: GroupeConfigComponent;
  let fixture: ComponentFixture<GroupeConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupeConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupeConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
