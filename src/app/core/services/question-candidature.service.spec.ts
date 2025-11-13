import { TestBed } from '@angular/core/testing';

import { QuestionCandidatureService } from './question-candidature.service';

describe('QuestionCandidatureService', () => {
  let service: QuestionCandidatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionCandidatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
