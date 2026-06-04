import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-verify-poi',
  standalone: true,
  imports: [OnboardingBreadcrumbComponent],
  templateUrl: './verify-poi.component.html',
  styleUrl: './verify-poi.component.scss'
})
export class VerifyPoiComponent implements OnInit {
  token = '';
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private onboardingService: OnboardingService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
  }

  confirm(): void {
    this.saving = true;
    this.onboardingService.verifyPoi(this.token).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.router.navigate(['/onboarding', this.token, 'test-reports']);
        });
      },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
