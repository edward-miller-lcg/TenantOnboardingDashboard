import { Injectable, signal } from '@angular/core';
import { SessionResponse, STEP_ORDER } from '../interfaces/onboarding.interfaces';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private _session = signal<SessionResponse | null>(null);

  readonly session = this._session.asReadonly();

  set(session: SessionResponse): void {
    this._session.set(session);
  }

  clear(): void {
    this._session.set(null);
  }

  get vendor(): string | undefined {
    return this._session()?.ehrVendor;
  }

  get facilityId(): string | undefined {
    return this._session()?.facilityId;
  }

  isStepCompleted(stepName: string): boolean {
    return this._session()?.stepProgress[stepName] === true;
  }

  isStepAccessible(stepName: string): boolean {
    const session = this._session();
    if (!session) return false;
    if (session.stepProgress[stepName]) return true;

    const idx = STEP_ORDER.indexOf(stepName as any);
    if (idx === 0) return true;
    if (idx < 0) return false;

    const prevStep = STEP_ORDER[idx - 1];
    return session.stepProgress[prevStep] === true;
  }

  getNextStep(): string | null {
    const session = this._session();
    if (!session) return null;
    for (const step of STEP_ORDER) {
      if (!session.stepProgress[step]) return step;
    }
    return null;
  }
}
