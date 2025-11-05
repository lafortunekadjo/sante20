import { TestBed } from '@angular/core/testing';

import { ObjectifsService } from './objectifs.service';

describe('ObjectifsService', () => {
  let service: ObjectifsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectifsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
