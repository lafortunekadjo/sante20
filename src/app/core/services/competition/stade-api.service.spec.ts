import { TestBed } from '@angular/core/testing';

import { StadeApiService } from './stade-api.service';

describe('StadeApiService', () => {
  let service: StadeApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StadeApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
