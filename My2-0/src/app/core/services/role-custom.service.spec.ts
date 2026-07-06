import { TestBed } from '@angular/core/testing';

import { RoleCustomService } from './role-custom.service';

describe('RoleCustomService', () => {
  let service: RoleCustomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleCustomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
