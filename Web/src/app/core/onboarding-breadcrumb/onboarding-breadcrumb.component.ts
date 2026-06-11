import { Component, Input, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { UiPreferenceService } from '../../services/ui-preference.service';

interface BreadcrumbItem {
  label: string;
  route: string[];
  completed: boolean;
  isCurrent: boolean;
}

const STEP_BREADCRUMBS: { step: string; label: string; path: string }[] = [
  { step: 'ComplianceAttestation', label: 'Overview', path: '' },
  { step: 'FacilityInfo', label: 'Facility Info', path: 'facility-info' },
  { step: 'ServerInfo', label: 'Server Info', path: 'server-info' },
  { step: 'Authorization', label: 'Authentication', path: 'authorization' },
  { step: 'ConnectionTest', label: 'Connection Test', path: 'connection-test' },
  { step: 'PatientsOfInterest', label: 'Patients of Interest', path: 'patients-of-interest' },
  { step: 'LocationTypeMapping', label: 'HSLOC Map', path: 'location-type-mapping' },
  { step: 'EncounterTypeMapping', label: 'Encounter.type Map', path: 'encounter-type-mapping' },
  { step: 'VerifyPoi', label: 'Verify POI', path: 'verify-poi' },
  { step: 'TestReport', label: 'Test Report', path: 'test-reports' },
  { step: 'Normalizations', label: 'Normalizations', path: 'normalizations' },
];

@Component({
  selector: 'app-onboarding-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './onboarding-breadcrumb.component.html',
  styleUrl: './onboarding-breadcrumb.component.scss'
})
export class OnboardingBreadcrumbComponent implements OnChanges {
  @Input() token = '';
  @Input() currentStep = '';

  breadcrumbs: BreadcrumbItem[] = [];

  constructor(
    private sessionService: SessionService,
    public uiPreference: UiPreferenceService
  ) {}

  ngOnChanges(): void {
    this.buildBreadcrumbs();
  }

  private buildBreadcrumbs(): void {
    const session = this.sessionService.session();
    this.breadcrumbs = [];

    for (const item of STEP_BREADCRUMBS) {
      const completed = session?.stepProgress[item.step] === true;
      const isCurrent = item.step === this.currentStep;

      if (!completed && !isCurrent) continue;

      this.breadcrumbs.push({
        label: item.label,
        route: ['/onboarding', this.token, item.path].filter(Boolean),
        completed,
        isCurrent
      });

      if (isCurrent) break;
    }
  }
}
