import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { UiPreferenceService } from '../../services/ui-preference.service';
import { NormalizationItem } from '../../interfaces/onboarding.interfaces';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';
import { NormalizationGridComponent } from './grid/normalization-grid.component';

const TYPE_LABELS: Record<string, string> = {
  CodeMap: 'Code Map',
  CopyProperty: 'Copy Property',
  ConditionalTransform: 'Conditional Transform',
  CopyLocation: 'Copy Location',
  RemoveExtensions: 'Remove Extensions'
};

const EDITABLE_TYPES = new Set(['CodeMap', 'CopyProperty', 'ConditionalTransform']);

@Component({
  selector: 'app-normalizations',
  standalone: true,
  imports: [RouterLink, OnboardingBreadcrumbComponent, NormalizationGridComponent],
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
    public uiPreference: UiPreferenceService,
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

  isEditable(item: NormalizationItem): boolean {
    return EDITABLE_TYPES.has(item.operationType);
  }

  edit(item: NormalizationItem): void {
    const routeMap: Record<string, string> = {
      CodeMap: 'code-map',
      CopyProperty: 'copy-property',
      ConditionalTransform: 'conditional'
    };
    const route = routeMap[item.operationType];
    if (route) this.router.navigate(['/onboarding', this.token, 'normalizations', route, item.id]);
  }

  delete(item: NormalizationItem): void {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    this.onboardingService.deleteNormalization(this.token, item.id).subscribe({ next: () => this.load() });
  }

  addNew(type: 'code-map' | 'copy-property' | 'conditional'): void {
    this.addMenuOpen = false;
    this.router.navigate(['/onboarding', this.token, 'normalizations', type]);
  }

  typeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type;
  }

  resourceTypeBadges(item: NormalizationItem): string {
    return item.resourceTypes.join(', ') || '—';
  }
}
