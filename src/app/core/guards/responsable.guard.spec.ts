import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { responsableGuard } from './responsable.guard';

describe('responsableGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => responsableGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
