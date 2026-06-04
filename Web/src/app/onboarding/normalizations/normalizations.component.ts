import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { NormalizationItem } from '../../interfaces/onboarding.interfaces';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-normalizations',
  standalone: true,
  imports: [RouterLink, OnboardingBreadcrumbComponent],
  templateUrl: './normalizations.component.html',
  styleUrl: './normalizations.component.scss'
})
export class NormalizationsComponent implements OnInit {
  token = '';
  normalizations: NormalizationItem[] = [];
  loading = true;
  addMenuOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private onboardingService: OnboardingService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.onboardingService.getNormalizations(this.token).subscribe({
      next: items => { this.normalizations = items; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.normalizations = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  edit(item: NormalizationItem): void {
    const typeMap: Record<string, string> = {
      CodeMap: 'code-map',
      CopyProperty: 'copy-property',
      ConditionalTransformation: 'conditional'
    };
    this.router.navigate(['/onboarding', this.token, 'normalizations', typeMap[item.type], item.id]);
  }

  delete(item: NormalizationItem): void {
    if (!confirm(`Delete normalization "${item.name}"?`)) return;
    this.onboardingService.deleteNormalization(this.token, item.id).subscribe({ next: () => this.load() });
  }

  addNew(type: 'code-map' | 'copy-property' | 'conditional'): void {
    this.addMenuOpen = false;
    this.router.navigate(['/onboarding', this.token, 'normalizations', type]);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = { CodeMap: 'Code Map', CopyProperty: 'Copy Property', ConditionalTransformation: 'Conditional Transformation' };
    return map[type] ?? type;
  }
}
