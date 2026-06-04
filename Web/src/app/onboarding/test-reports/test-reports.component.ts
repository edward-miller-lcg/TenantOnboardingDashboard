import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { TestReport } from '../../interfaces/onboarding.interfaces';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-test-reports',
  standalone: true,
  imports: [RouterLink, DatePipe, OnboardingBreadcrumbComponent],
  templateUrl: './test-reports.component.html',
  styleUrl: './test-reports.component.scss'
})
export class TestReportsComponent implements OnInit {
  token = '';
  reports: TestReport[] = [];
  loading = true;
  completing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private onboardingService: OnboardingService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.onboardingService.getReports(this.token).subscribe({
      next: reports => { this.reports = reports; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.reports = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get hasSuccessfulReport(): boolean {
    return this.reports.some(r => r.result === 'SUCCESS' && (r.unacceptableIssues ?? 1) === 0);
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/onboarding', this.token, 'prequalification', reportId]);
  }

  completeOnboarding(): void {
    this.completing = true;
    this.onboardingService.completeOnboarding(this.token).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.router.navigate(['/onboarding', this.token, 'operations']);
        });
      },
      error: () => { this.completing = false; this.cdr.markForCheck(); }
    });
  }
}
