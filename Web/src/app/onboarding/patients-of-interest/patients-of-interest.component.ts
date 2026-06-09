import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

/**
 * Validates that the value is a comma-separated list of at least two IDs.
 * Each ID may contain letters, digits, and hyphens.
 * Single values with no comma separator are rejected (BUG-3 fix).
 */
function patientListIdsValidator(control: AbstractControl): ValidationErrors | null {
  const raw: string = (control.value ?? '').trim();
  if (!raw) return null; // let Validators.required handle the empty case

  const ids = raw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

  if (ids.length < 2) {
    return { commaRequired: true };
  }
  if (ids.some((id: string) => !/^[\w-]+$/.test(id))) {
    return { invalidFormat: true };
  }
  return null;
}

@Component({
  selector: 'app-patients-of-interest',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './patients-of-interest.component.html',
  styleUrl: './patients-of-interest.component.scss'
})
export class PatientsOfInterestComponent implements OnInit {
  token = '';
  vendor = 'Epic';
  saving = false;
  error = '';

  epicForm = new FormGroup({
    patientListIds: new FormControl('', [Validators.required, patientListIdsValidator])
  });

  cernerForm = new FormGroup({
    sftpUrl: new FormControl('', Validators.required),
    sftpUsername: new FormControl('', Validators.required),
    sftpPassword: new FormControl('', Validators.required)
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
    this.vendor = this.sessionService.session()?.ehrVendor ?? 'Epic';
    const fd = this.sessionService.session()?.formData;
    if (fd?.['PatientListIds']) this.epicForm.patchValue({ patientListIds: fd['PatientListIds'] });
    if (fd?.['SftpUrl']) this.cernerForm.patchValue({ sftpUrl: fd['SftpUrl'], sftpUsername: fd['SftpUsername'], sftpPassword: fd['SftpPassword'] });
  }

  get isEpic(): boolean { return this.vendor === 'Epic'; }

  save(): void {
    if (this.isEpic && this.epicForm.invalid) { this.epicForm.markAllAsTouched(); return; }
    if (!this.isEpic && this.cernerForm.invalid) { this.cernerForm.markAllAsTouched(); return; }

    this.saving = true;
    this.error = '';
    const obs = this.isEpic
      ? this.onboardingService.savePatientsOfInterestEpic(this.token, this.epicForm.value.patientListIds!)
      : this.onboardingService.savePatientsOfInterestCerner(this.token, {
          sftpUrl: this.cernerForm.value.sftpUrl!,
          sftpUsername: this.cernerForm.value.sftpUsername!,
          sftpPassword: this.cernerForm.value.sftpPassword!
        });

    obs.subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.saving = false;
          this.router.navigate(['/onboarding', this.token, 'location-type-mapping']);
        });
      },
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
