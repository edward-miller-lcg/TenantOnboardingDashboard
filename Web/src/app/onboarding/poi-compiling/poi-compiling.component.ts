import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-poi-compiling',
  standalone: true,
  imports: [OnboardingBreadcrumbComponent],
  templateUrl: './poi-compiling.component.html',
  styleUrl: './poi-compiling.component.scss'
})
export class PoiCompilingComponent implements OnInit {
  token = '';

  constructor(
    private route: ActivatedRoute,
    private onboardingService: OnboardingService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    // Trigger POI compilation on arrival
    this.onboardingService.startPoiCompiling(this.token).subscribe({
      next: () => this.onboardingService.getSession(this.token).subscribe(s => this.sessionService.set(s))
    });
  }
}
