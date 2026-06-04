import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

const FHIR_RESOURCE_TYPES = ['Patient','Encounter','Observation','Condition','MedicationRequest','Procedure','DiagnosticReport','AllergyIntolerance','Immunization','Location'];
const OPERATORS = ['Equals','NotEquals','Exists','NotExists','GreaterThan','LessThan'];

@Component({
  selector: 'app-conditional-transformation',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './conditional-transformation.component.html',
  styleUrl: './conditional-transformation.component.scss'
})
export class ConditionalTransformationComponent implements OnInit {
  token = '';
  editId: string | null = null;
  saving = false;
  error = '';
  resourceTypes = FHIR_RESOURCE_TYPES;
  operators = OPERATORS;

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    resourceType: new FormControl('', Validators.required),
    targetFhirPath: new FormControl('', Validators.required),
    targetValue: new FormControl('', Validators.required),
    conditions: new FormArray([this.newCondition()]),
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

  get conditions(): FormArray { return this.form.get('conditions') as FormArray; }

  newCondition(): FormGroup {
    return new FormGroup({
      fhirPath: new FormControl(''),
      operator: new FormControl('Equals'),
      value: new FormControl('')
    });
  }

  addCondition(): void { this.conditions.push(this.newCondition()); }
  removeCondition(i: number): void { this.conditions.removeAt(i); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.editId
      ? this.onboardingService.updateConditional(this.token, this.editId, this.form.value)
      : this.onboardingService.createConditional(this.token, this.form.value);
    obs.subscribe({
      next: () => this.router.navigate(['/onboarding', this.token, 'normalizations']),
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }

  cancel(): void { this.router.navigate(['/onboarding', this.token, 'normalizations']); }
}
