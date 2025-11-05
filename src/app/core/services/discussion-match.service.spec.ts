import { TestBed } from '@angular/core/testing';

import { DiscussionMatchService } from './discussion-match.service';

describe('DiscussionMatchService', () => {
  let service: DiscussionMatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiscussionMatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
