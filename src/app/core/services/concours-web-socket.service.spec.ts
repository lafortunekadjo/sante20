import { TestBed } from '@angular/core/testing';

import { ConcoursWebSocketService } from './concours-web-socket.service';

describe('ConcoursWebSocketService', () => {
  let service: ConcoursWebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConcoursWebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
