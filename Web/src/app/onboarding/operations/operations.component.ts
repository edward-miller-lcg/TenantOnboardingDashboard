import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [RouterLink, OnboardingBreadcrumbComponent],
  templateUrl: './operations.component.html',
  styleUrl: './operations.component.scss'
})
export class OperationsComponent implements OnInit {
  token = '';

  configSteps = [
    { label: 'Facility Info', path: 'facility-info' },
    { label: 'Server Info', path: 'server-info' },
    { label: 'Authorization', path: 'authorization' },
    { label: 'Connection Test', path: 'connection-test' },
    { label: 'Patients of Interest', path: 'patients-of-interest' },
    { label: 'Location.type Mapping', path: 'location-type-mapping' },
    { label: 'Encounter.type Mapping', path: 'encounter-type-mapping' },
  ];

  validationSteps = [
    { label: 'Test Report', path: 'test-reports' },
    { label: 'Validation', path: 'verify-poi' },
    { label: 'Normalizations', path: 'normalizations' },
  ];

  constructor(
    private route: ActivatedRoute,
    public sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
  }
}
