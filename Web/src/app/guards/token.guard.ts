import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { SessionService } from '../services/session.service';
import { catchError, map, of } from 'rxjs';

export const tokenGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const token = route.paramMap.get('token') ?? route.parent?.paramMap.get('token');
  if (!token) return false;

  const onboardingService = inject(OnboardingService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const existing = sessionService.session();
  if (existing && existing.token === token) return true;

  return onboardingService.getSession(token).pipe(
    map(session => {
      sessionService.set(session);
      return true;
    }),
    catchError(() => {
      router.navigate(['/not-found']);
      return of(false);
    })
  );
};
