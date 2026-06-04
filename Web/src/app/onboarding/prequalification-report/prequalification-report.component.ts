import { Component, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { PrequalificationReport } from '../../interfaces/onboarding.interfaces';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-prequalification-report',
  standalone: true,
  imports: [RouterLink, SlicePipe, OnboardingBreadcrumbComponent],
  templateUrl: './prequalification-report.component.html',
  styleUrl: './prequalification-report.component.scss'
})
export class PrequalificationReportComponent implements OnInit {
  token = '';
  reportId = '';
  report: PrequalificationReport | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private onboardingService: OnboardingService,
    public sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    this.reportId = this.route.snapshot.paramMap.get('reportId') ?? '';
    this.onboardingService.getReport(this.token, this.reportId).subscribe({
      next: r => { this.report = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  viewCategory(categoryId: string): void {
    this.router.navigate(['/onboarding', this.token, 'prequalification', this.reportId, 'category', categoryId]);
  }

  get maxIssues(): number {
    if (!this.report) return 1;
    const all = [...(this.report.unacceptableCategories ?? []), ...(this.report.acceptableCategories ?? [])];
    return Math.max(...all.map(c => c.numberOfIssues), 1);
  }

  barWidth(issues: number): string {
    return `${Math.round((issues / this.maxIssues) * 100)}%`;
  }
}
