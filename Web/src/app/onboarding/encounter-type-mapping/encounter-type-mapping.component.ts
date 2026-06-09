import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

// Standard SNOMED CT codes used for Encounter.type mapping (Epic → SNOMED).
// Source: CDC NHSN reporting requirements + Epic integration reference.
const SNOMED_TARGET_CODES = [
  { code: '11429006',  display: 'Consultation' },
  { code: '3285007',   display: 'Hospital admission (from another hospital)' },
  { code: '32485007',  display: 'Hospital admission' },
  { code: '305351004', display: 'Admission to ICU' },
  { code: '4525004',   display: 'Emergency department patient visit' },
  { code: '50849002',  display: 'Emergency room admission' },
  { code: '371883000', display: 'Outpatient procedure' },
  { code: '185389009', display: 'Follow-up visit' },
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
  pasteError = '';
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
        this.cdr.markForCheck();
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

  // ---- Bulk paste (TSV from Excel: ColA=Epic code, ColB=SNOMED code, ColC=Display) ----
  onPasteTsv(event: ClipboardEvent, mapIndex: number): void {
    event.preventDefault();
    this.pasteError = '';
    const text = event.clipboardData?.getData('text') ?? '';
    const parsed = this.parsePaste(text, '\t') ?? this.parsePaste(text, ',');
    if (parsed) this.applyParsed(mapIndex, parsed);
  }

  pasteFromClipboard(mapIndex: number): void {
    navigator.clipboard.readText().then(text => {
      this.pasteError = '';
      const parsed = this.parsePaste(text, '\t') ?? this.parsePaste(text, ',');
      if (parsed) this.applyParsed(mapIndex, parsed);
      this.cdr.markForCheck();
    }).catch(() => {
      this.pasteError = 'Clipboard access denied. Use Ctrl+V directly in the table instead.';
      this.cdr.markForCheck();
    });
  }

  private parsePaste(text: string, delimiter: string): { sourceCode: string; targetCode: string; display: string }[] | null {
    const rows = text.trim().split('\n').map(r => r.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
    if (!rows.length || rows[0].length < 2) return null;
    const entries = rows.filter(r => r[0] && r[1]).map(r => ({
      sourceCode: r[0],
      targetCode: r[1],
      display: r[2] ?? (this.snomedCodes.find(s => s.code === r[1])?.display ?? r[1])
    }));
    return entries.length ? entries : null;
  }

  private applyParsed(mapIndex: number, entries: { sourceCode: string; targetCode: string; display: string }[]): void {
    const codesArray = this.codesOf(mapIndex);
    codesArray.clear();
    entries.forEach(e => codesArray.push(new FormGroup({
      sourceCode: new FormControl(e.sourceCode),
      targetCode: new FormControl(e.targetCode),
      display: new FormControl(e.display)
    })));
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';
    const payload = {
      resourceType: 'Encounter',
      fhirPath: 'Encounter.type.coding',
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
      error: err => {
        this.error = err?.error?.error ?? err.message ?? 'Failed to save encounter type mapping.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }
}
