import { Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { filter, map } from 'rxjs';
import { NhsnHeaderComponent } from '../../core/nhsn-header/nhsn-header.component';
import { NhsnNavComponent } from '../../core/nhsn-nav/nhsn-nav.component';
import { WorkspaceToolbarComponent } from '../../core/workspace-toolbar/workspace-toolbar.component';
import { WorkspaceNavComponent } from '../../core/workspace-nav/workspace-nav.component';
import { WorkspaceStepperComponent } from '../../core/workspace-stepper/workspace-stepper.component';
import { SETUP_STEPS } from '../../core/workspace-nav/setup-steps';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { UiPreferenceService } from '../../services/ui-preference.service';

@Component({
  selector: 'app-onboarding-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    NhsnHeaderComponent,
    NhsnNavComponent,
    WorkspaceToolbarComponent,
    WorkspaceNavComponent,
    WorkspaceStepperComponent
  ],
  templateUrl: './onboarding-shell.component.html',
  styleUrl: './onboarding-shell.component.scss'
})
export class OnboardingShellComponent implements OnInit {
  token = '';

  private router = inject(Router);

  // The route segment after /onboarding/:token/ — used to highlight the active setup step.
  currentStepPath = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.extractStepPath())
    ),
    { initialValue: this.extractStepPath() }
  );

  isSetupPage = computed(() => SETUP_STEPS.some(s => s.path === this.currentStepPath()));

  constructor(
    private route: ActivatedRoute,
    private onboardingService: OnboardingService,
    private sessionService: SessionService,
    public uiPreference: UiPreferenceService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    // Refresh session state on shell load
    if (this.token) {
      this.onboardingService.getSession(this.token).subscribe(session => {
        this.sessionService.set(session);
      });
    }
  }

  private extractStepPath(): string {
    const segments = this.router.url.split('?')[0].split('/').filter(Boolean);
    // segments: ['onboarding', token, ...rest]
    return segments.slice(2).join('/');
  }
}
