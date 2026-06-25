import { TestBed } from '@angular/core/testing';

import { JourneeApiService } from './journee-api.service';

describe('JourneeApiService', () => {
  let service: JourneeApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JourneeApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
