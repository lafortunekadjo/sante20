import { TestBed } from '@angular/core/testing';

import { MatchRequestService } from './match-request.service';

describe('MatchRequestService', () => {
  let service: MatchRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
