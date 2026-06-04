import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-run-test-report',
  standalone: true,
  imports: [DatePipe, OnboardingBreadcrumbComponent],
  templateUrl: './run-test-report.component.html',
  styleUrl: './run-test-report.component.scss'
})
export class RunTestReportComponent implements OnInit {
  token = '';
  generating = false;
  generated = false;
  error = '';

  // Default to the past month as the POI date range
  startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
  endDate = new Date();

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

  generate(): void {
    this.generating = true;
    this.error = '';
    this.onboardingService.generateReport(this.token, this.startDate, this.endDate).subscribe({
      next: () => {
        this.generating = false;
        this.generated = true;
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/onboarding', this.token, 'test-reports']), 1500);
      },
      error: err => { this.error = err.message ?? 'Failed to generate report.'; this.generating = false; this.cdr.markForCheck(); }
    });
  }
}
