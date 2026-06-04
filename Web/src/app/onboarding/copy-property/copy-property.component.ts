import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

const FHIR_RESOURCE_TYPES = ['Patient','Encounter','Observation','Condition','MedicationRequest','Procedure','DiagnosticReport','AllergyIntolerance','Immunization','Location'];

@Component({
  selector: 'app-copy-property',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './copy-property.component.html',
  styleUrl: './copy-property.component.scss'
})
export class CopyPropertyComponent implements OnInit {
  token = '';
  editId: string | null = null;
  saving = false;
  error = '';
  resourceTypes = FHIR_RESOURCE_TYPES;

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    resourceType: new FormControl('', Validators.required),
    sourceFhirPath: new FormControl('', Validators.required),
    targetFhirPath: new FormControl('', Validators.required),
    enabled: new FormControl(true)
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private onboardingService: OnboardingService,
    public sessionService: SessionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.parent?.snapshot.paramMap.get('token') ?? '';
    this.editId = this.route.snapshot.paramMap.get('id') ?? null;
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.editId
      ? this.onboardingService.updateCopyProperty(this.token, this.editId, this.form.value)
      : this.onboardingService.createCopyProperty(this.token, this.form.value);
    obs.subscribe({
      next: () => this.router.navigate(['/onboarding', this.token, 'normalizations']),
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }

  cancel(): void { this.router.navigate(['/onboarding', this.token, 'normalizations']); }
}
