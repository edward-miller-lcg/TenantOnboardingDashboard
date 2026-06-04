import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

const SNOMED_TARGET_CODES = [
  { code: '4525004', display: 'Emergency dept' },
  { code: '3285007', display: 'Hospital admission' },
  { code: '11429006', display: 'Consultation' },
  { code: '305351004', display: 'Admission to ICU' },
  { code: '32485007', display: 'Hospital inpatient' },
];

@Component({
  selector: 'app-encounter-type-mapping',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './encounter-type-mapping.component.html',
  styleUrl: './encounter-type-mapping.component.scss'
})
export class EncounterTypeMappingComponent implements OnInit {
  token = '';
  saving = false;
  error = '';
  snomedCodes = SNOMED_TARGET_CODES;

  form = new FormGroup({
    codeSystemMaps: new FormArray([this.newCodeSystemMap()])
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
    this.onboardingService.getEncounterTypeMapping(this.token).subscribe(existing => {
      if (existing?.codeSystemMaps?.length) {
        this.form.setControl('codeSystemMaps', new FormArray(
          existing.codeSystemMaps.map(csm => {
            const group = this.newCodeSystemMap();
            group.patchValue({ sourceSystem: csm.sourceSystem, targetSystem: csm.targetSystem });
            const codesArray = group.get('codes') as FormArray;
            codesArray.clear();
            csm.codes.forEach(c => codesArray.push(new FormGroup({
              sourceCode: new FormControl(c.sourceCode),
              targetCode: new FormControl(c.targetCode),
              display: new FormControl(c.display)
            })));
            return group;
          })
        ));
      }
    });
  }

  get codeSystemMaps(): FormArray { return this.form.get('codeSystemMaps') as FormArray; }

  codesOf(mapIndex: number): FormArray {
    return (this.codeSystemMaps.at(mapIndex) as FormGroup).get('codes') as FormArray;
  }

  newCodeSystemMap(): FormGroup {
    return new FormGroup({
      sourceSystem: new FormControl('', Validators.required),
      targetSystem: new FormControl('http://snomed.info/sct'),
      codes: new FormArray([this.newCode()])
    });
  }

  newCode(): FormGroup {
    return new FormGroup({
      sourceCode: new FormControl(''),
      targetCode: new FormControl(''),
      display: new FormControl('')
    });
  }

  addMap(): void { this.codeSystemMaps.push(this.newCodeSystemMap()); }
  removeMap(i: number): void { this.codeSystemMaps.removeAt(i); }
  addCode(mapIndex: number): void { this.codesOf(mapIndex).push(this.newCode()); }
  removeCode(mapIndex: number, codeIndex: number): void { this.codesOf(mapIndex).removeAt(codeIndex); }

  onTargetCodeChange(mapIndex: number, codeIndex: number, targetCode: string): void {
    const match = this.snomedCodes.find(s => s.code === targetCode);
    const codeGroup = this.codesOf(mapIndex).at(codeIndex) as FormGroup;
    codeGroup.patchValue({ display: match?.display ?? '' });
  }

  save(): void {
    this.saving = true;
    const payload = {
      resourceType: 'Encounter',
      fhirPath: 'type',
      codeSystemMaps: this.codeSystemMaps.value
    };
    this.onboardingService.saveEncounterTypeMapping(this.token, payload).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.saving = false;
          this.router.navigate(['/onboarding', this.token, 'poi-compiling']);
        });
      },
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
