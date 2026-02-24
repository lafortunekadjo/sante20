import { TestBed } from '@angular/core/testing';

import { PartenaireAuthService } from './partenaire-auth.service';

describe('PartenaireAuthService', () => {
  let service: PartenaireAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartenaireAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
