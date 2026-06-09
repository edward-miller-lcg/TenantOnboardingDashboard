import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

const HSLOC_TARGET_SYSTEM = 'https://www.cdc.gov/nhsn/cdaportal/terminology/codesystem/hsloc.html';

@Component({
  selector: 'app-location-type-mapping',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './location-type-mapping.component.html',
  styleUrl: './location-type-mapping.component.scss'
})
export class LocationTypeMappingComponent implements OnInit {
  token = '';
  saving = false;
  error = '';
  pasteError = '';
  readonly hslocTargetSystem = HSLOC_TARGET_SYSTEM;

  form = new FormGroup({
    sourceSystem: new FormControl('', Validators.required),
    codes: new FormArray([this.newCode()])
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
    this.onboardingService.getLocationTypeMapping(this.token).subscribe(existing => {
      if (existing?.codes?.length) {
        this.form.patchValue({ sourceSystem: existing.sourceSystem });
        const codesArray = this.codes;
        codesArray.clear();
        existing.codes.forEach(c => codesArray.push(new FormGroup({
          sourceCode: new FormControl(c.sourceCode),
          targetCode: new FormControl(c.targetCode),
          display: new FormControl(c.display)
        })));
        this.cdr.markForCheck();
      }
    });
  }

  get codes(): FormArray { return this.form.get('codes') as FormArray; }

  newCode(): FormGroup {
    return new FormGroup({
      sourceCode: new FormControl(''),
      targetCode: new FormControl(''),
      display: new FormControl('')
    });
  }

  addCode(): void { this.codes.push(this.newCode()); }
  removeCode(i: number): void { this.codes.removeAt(i); }

  // ---- Bulk paste (TSV from Excel: ColA=Epic code, ColB=HSLOC code, ColC=Display) ----
  onPasteTsv(event: ClipboardEvent): void {
    event.preventDefault();
    this.pasteError = '';
    const text = event.clipboardData?.getData('text') ?? '';
    const parsed = this.parsePaste(text, '\t');
    if (!parsed) return;
    this.applyParsed(parsed);
  }

  pasteFromClipboard(): void {
    navigator.clipboard.readText().then(text => {
      this.pasteError = '';
      // Try TSV first, then CSV
      const parsed = this.parsePaste(text, '\t') ?? this.parsePaste(text, ',');
      if (parsed) this.applyParsed(parsed);
      this.cdr.markForCheck();
    }).catch(() => {
      this.pasteError = 'Clipboard access denied. Use Ctrl+V directly into the paste area instead.';
      this.cdr.markForCheck();
    });
  }

  private parsePaste(text: string, delimiter: string): { sourceCode: string; targetCode: string; display: string }[] | null {
    const rows = text.trim().split('\n').map(r => r.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
    if (!rows.length || rows[0].length < 2) {
      this.pasteError = 'Expected at least 2 columns: Source Code, HSLOC Code (optional 3rd: Display Text).';
      return null;
    }
    return rows
      .filter(r => r[0] && r[1])
      .map(r => ({ sourceCode: r[0], targetCode: r[1], display: r[2] ?? r[1] }));
  }

  private applyParsed(entries: { sourceCode: string; targetCode: string; display: string }[]): void {
    this.codes.clear();
    entries.forEach(e => this.codes.push(new FormGroup({
      sourceCode: new FormControl(e.sourceCode),
      targetCode: new FormControl(e.targetCode),
      display: new FormControl(e.display)
    })));
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';
    const { sourceSystem, codes } = this.form.value;
    this.onboardingService.saveLocationTypeMapping(this.token, {
      sourceSystem: sourceSystem ?? '',
      codes: (codes ?? []).filter((c: any) => c.sourceCode && c.targetCode)
    }).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.saving = false;
          this.router.navigate(['/onboarding', this.token, 'encounter-type-mapping']);
        });
      },
      error: err => {
        this.error = err?.error?.error ?? err.message ?? 'Failed to save location mapping.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }
}
