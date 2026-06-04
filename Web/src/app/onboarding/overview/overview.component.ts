import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

interface StepItem {
  label: string;
  step: string;
  path: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [RouterLink, OnboardingBreadcrumbComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  token = '';

  configSteps: StepItem[] = [
    { label: 'Facility Info', step: 'FacilityInfo', path: 'facility-info' },
    { label: 'Server Info', step: 'ServerInfo', path: 'server-info' },
    { label: 'Authorization', step: 'Authorization', path: 'authorization' },
    { label: 'Connection Test', step: 'ConnectionTest', path: 'connection-test' },
    { label: 'Patients of Interest', step: 'PatientsOfInterest', path: 'patients-of-interest' },
    { label: 'Location.type Mapping', step: 'LocationTypeMapping', path: 'location-type-mapping' },
    { label: 'Encounter.type Mapping', step: 'EncounterTypeMapping', path: 'encounter-type-mapping' },
  ];

  validationSteps: StepItem[] = [
    { label: 'Test Report', step: 'TestReport', path: 'test-reports' },
    { label: 'Validation', step: 'VerifyPoi', path: 'verify-poi' },
    { label: 'Normalizations', step: 'Normalizations', path: 'normalizations' },
  ];

  operationsStep: StepItem = { label: 'Operations', step: 'Operations', path: 'operations' };

  isComplete = false;

  constructor(
    private route: ActivatedRoute,
    public sessionService: SessionService,
    private onboardingService: OnboardingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    this.onboardingService.getSession(this.token).subscribe(s => {
      this.sessionService.set(s);
      this.isComplete = s.status === 'Completed';
      this.cdr.markForCheck();
    });
  }

  isAccessible(step: StepItem): boolean {
    return this.sessionService.isStepAccessible(step.step);
  }

  isCompleted(step: StepItem): boolean {
    return this.sessionService.isStepCompleted(step.step);
  }

  nextStepPath(): string {
    const next = this.sessionService.getNextStep();
    if (!next) return '';
    const pathMap: Record<string, string> = {
      ComplianceAttestation: '',
      FacilityInfo: 'facility-info',
      ServerInfo: 'server-info',
      Authorization: 'authorization',
      ConnectionTest: 'connection-test',
      PatientsOfInterest: 'patients-of-interest',
      LocationTypeMapping: 'location-type-mapping',
      EncounterTypeMapping: 'encounter-type-mapping',
      PoiCompiling: 'poi-compiling',
      VerifyPoi: 'verify-poi',
      TestReport: 'test-reports',
      Operations: 'operations'
    };
    return pathMap[next] ?? '';
  }
}
