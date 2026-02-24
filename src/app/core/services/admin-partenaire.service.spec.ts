import { TestBed } from '@angular/core/testing';

import { AdminPartenaireService } from './admin-partenaire.service';

describe('AdminPartenaireService', () => {
  let service: AdminPartenaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminPartenaireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
