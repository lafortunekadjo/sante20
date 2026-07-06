import { TestBed } from '@angular/core/testing';

import { GroupeContextService } from './groupe-context.service';

describe('GroupeContextService', () => {
  let service: GroupeContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupeContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
