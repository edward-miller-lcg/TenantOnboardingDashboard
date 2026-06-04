import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

const FHIR_RESOURCE_TYPES = ['Patient','Encounter','Observation','Condition','MedicationRequest','Procedure','DiagnosticReport','AllergyIntolerance','Immunization','Location'];

@Component({
  selector: 'app-code-map',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './code-map.component.html',
  styleUrl: './code-map.component.scss'
})
export class CodeMapComponent implements OnInit {
  token = '';
  editId: string | null = null;
  saving = false;
  error = '';
  resourceTypes = FHIR_RESOURCE_TYPES;

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    resourceType: new FormControl('', Validators.required),
    fhirPath: new FormControl('', Validators.required),
    codeSystemMaps: new FormArray([this.newMap()])
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

  get maps(): FormArray { return this.form.get('codeSystemMaps') as FormArray; }
  codesOf(i: number): FormArray { return (this.maps.at(i) as FormGroup).get('codes') as FormArray; }

  newMap(): FormGroup {
    return new FormGroup({
      sourceSystem: new FormControl(''),
      targetSystem: new FormControl(''),
      codes: new FormArray([this.newCode(), this.newCode(), this.newCode()])
    });
  }

  newCode(): FormGroup {
    return new FormGroup({
      sourceCode: new FormControl(''),
      targetCode: new FormControl(''),
      display: new FormControl('')
    });
  }

  addMap(): void { this.maps.push(this.newMap()); }
  removeMap(i: number): void {
    if (!confirm('Clicking OK will delete all Code System map detail.')) return;
    this.maps.removeAt(i);
  }
  addCode(i: number): void { this.codesOf(i).push(this.newCode()); }
  removeCode(mi: number, ci: number): void { this.codesOf(mi).removeAt(ci); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.value;
    const obs = this.editId
      ? this.onboardingService.updateCodeMap(this.token, this.editId, payload)
      : this.onboardingService.createCodeMap(this.token, payload);
    obs.subscribe({
      next: () => this.router.navigate(['/onboarding', this.token, 'normalizations']),
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }

  cancel(): void { this.router.navigate(['/onboarding', this.token, 'normalizations']); }
}
