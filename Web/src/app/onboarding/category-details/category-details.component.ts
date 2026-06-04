import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { CategoryDetail } from '../../interfaces/onboarding.interfaces';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [RouterLink, OnboardingBreadcrumbComponent],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.scss'
})
export class CategoryDetailsComponent implements OnInit {
  token = '';
  reportId = '';
  categoryId = '';
  detail: CategoryDetail | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    this.reportId = this.route.snapshot.paramMap.get('reportId') ?? '';
    this.categoryId = this.route.snapshot.paramMap.get('categoryId') ?? '';

    // Load report and extract the requested category
    this.onboardingService.getReport(this.token, this.reportId).subscribe({
      next: report => {
        const all = [...(report.unacceptableCategories ?? []), ...(report.acceptableCategories ?? [])];
        const cat = all.find(c => c.id === this.categoryId);
        if (cat) {
          this.detail = {
            category: cat.category,
            guidance: cat.guidance,
            acceptable: cat.acceptable,
            issues: ((report.issuesSummary ?? []).filter((i: any) => i.categoryId === this.categoryId) as any[])
          };
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
