import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

const PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;
const US_TIMEZONES = [
  'America/New_York','America/Chicago','America/Denver','America/Phoenix',
  'America/Los_Angeles','America/Anchorage','America/Adak','Pacific/Honolulu',
  'America/Puerto_Rico','Pacific/Guam','Pacific/Saipan','Pacific/Pago_Pago',
  'America/Virgin'
];

@Component({
  selector: 'app-facility-info',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './facility-info.component.html',
  styleUrl: './facility-info.component.scss'
})
export class FacilityInfoComponent implements OnInit {
  token = '';
  timezones = US_TIMEZONES;
  saving = false;
  error = '';

  form = new FormGroup({
    organizationNames: new FormControl('', Validators.required),
    timeZone: new FormControl('', Validators.required),
    physicalAddress: new FormControl('', Validators.required),
    technicalContactPhone: new FormControl('', Validators.pattern(PHONE_PATTERN))
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
    const s = this.sessionService.session();
    if (s?.formData['OrganizationNames']) {
      this.form.patchValue({
        organizationNames: s.formData['OrganizationNames'],
        timeZone: s.formData['TimeZone'],
        physicalAddress: s.formData['PhysicalAddress'],
        technicalContactPhone: s.formData['TechnicalContactPhone']
      });
    }
  }

  get nhsnOrgId(): string { return this.sessionService.session()?.nhsnOrgId ?? ''; }
  get healthSystemName(): string { return this.sessionService.session()?.healthSystemName ?? ''; }

  save(andContinue: boolean): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.error = '';
    this.onboardingService.saveFacilityInfo(this.token, {
      organizationNames: this.form.value.organizationNames!,
      timeZone: this.form.value.timeZone!,
      physicalAddress: this.form.value.physicalAddress!,
      technicalContactPhone: this.form.value.technicalContactPhone ?? undefined
    }).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.saving = false;
          if (andContinue) this.router.navigate(['/onboarding', this.token, 'server-info']);
        });
      },
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
