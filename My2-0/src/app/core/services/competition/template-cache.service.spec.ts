import { TestBed } from '@angular/core/testing';

import { TemplateCacheService } from './template-cache.service';

describe('TemplateCacheService', () => {
  let service: TemplateCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
