import { TestBed } from '@angular/core/testing';

import { MatchInvitationService } from './match-invitation.service';

describe('MatchInvitationService', () => {
  let service: MatchInvitationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchInvitationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
