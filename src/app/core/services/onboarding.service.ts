// onboarding.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type OnboardingStep = 'NONE' | 'CREATE_ACCOUNT' | 'OPEN_MENU' | 'CREATE_GROUPE';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private currentStep = new BehaviorSubject<OnboardingStep>(this.getInitialStep());
  step$ = this.currentStep.asObservable();

  private getInitialStep(): OnboardingStep {
    const status = localStorage.getItem('my20_onboarding_status');
    return (status as OnboardingStep) || 'CREATE_ACCOUNT';
  }

  // ✅ AJOUTE CETTE MÉTHODE
  getStep(): OnboardingStep {
    return this.currentStep.value;
  }

  setStep(step: OnboardingStep) {
    localStorage.setItem('my20_onboarding_status', step);
    this.currentStep.next(step);
  }

  // onboarding.service.ts
stopTemporarily() {
  this.currentStep.next('NONE');
}

  complete() {
    this.setStep('NONE');
  }
}