import { TestBed } from '@angular/core/testing';

import { MatchImageService } from './match-image.service';

describe('MatchImageService', () => {
  let service: MatchImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
