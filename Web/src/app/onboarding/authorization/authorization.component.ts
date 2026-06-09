import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-authorization',
  standalone: true,
  imports: [FormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './authorization.component.html',
  styleUrl: './authorization.component.scss'
})
export class AuthorizationComponent implements OnInit {
  token = '';
  vendor = '';
  confirmed = false;
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
    this.vendor = this.sessionService.session()?.ehrVendor ?? 'Epic';
    // Restore checkbox state when returning to a previously completed step
    this.confirmed = this.sessionService.isStepCompleted('Authorization');
  }

  get checkboxLabel(): string {
    return `I have completed all ${this.vendor} set up requirements.`;
  }

  save(): void {
    if (!this.confirmed) return;
    this.saving = true;
    this.onboardingService.completeAuthorization(this.token).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.router.navigate(['/onboarding', this.token, 'connection-test']);
        });
      },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
