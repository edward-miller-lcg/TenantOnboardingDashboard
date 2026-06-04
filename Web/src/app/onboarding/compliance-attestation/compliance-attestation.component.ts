import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-compliance-attestation',
  standalone: true,
  imports: [FormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './compliance-attestation.component.html',
  styleUrl: './compliance-attestation.component.scss'
})
export class ComplianceAttestationComponent implements OnInit {
  token = '';
  agreed = false;
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
    // If already attested, go to overview
    if (this.sessionService.isStepCompleted('ComplianceAttestation')) {
      this.router.navigate(['/onboarding', this.token, 'overview']);
    }
  }

  save(): void {
    if (!this.agreed) return;
    this.saving = true;
    this.onboardingService.completeAttestation(this.token).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.router.navigate(['/onboarding', this.token, 'overview']);
        });
      },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
