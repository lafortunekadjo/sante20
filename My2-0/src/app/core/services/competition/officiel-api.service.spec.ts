import { TestBed } from '@angular/core/testing';

import { OfficielApiService } from './officiel-api.service';

describe('OfficielApiService', () => {
  let service: OfficielApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficielApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
