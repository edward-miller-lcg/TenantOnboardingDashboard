import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-server-info',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './server-info.component.html',
  styleUrl: './server-info.component.scss'
})
export class ServerInfoComponent implements OnInit {
  token = '';
  saving = false;
  error = '';

  vendors = [
    { value: 'Epic', label: 'Epic', disabled: false },
    { value: 'Cerner', label: 'Cerner', disabled: false },
    { value: 'PCC', label: 'PCC', disabled: true },
    { value: 'Meditech', label: 'Meditech', disabled: true }
  ];

  form = new FormGroup({
    fhirBaseUrl: new FormControl('', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]),
    ehrVendor: new FormControl('Epic', Validators.required)
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
    const fd = this.sessionService.session()?.formData;
    if (fd?.['FhirBaseUrl']) {
      this.form.patchValue({ fhirBaseUrl: fd['FhirBaseUrl'], ehrVendor: fd['EhrVendor'] ?? 'Epic' });
    }
  }

  save(andContinue: boolean): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.onboardingService.saveServerInfo(this.token, {
      fhirBaseUrl: this.form.value.fhirBaseUrl!,
      ehrVendor: this.form.value.ehrVendor!
    }).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.saving = false;
          if (andContinue) this.router.navigate(['/onboarding', this.token, 'authorization']);
        });
      },
      error: err => { this.error = err.message ?? 'Failed to save.'; this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
