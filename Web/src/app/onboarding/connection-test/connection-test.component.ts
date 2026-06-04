import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-connection-test',
  standalone: true,
  imports: [ReactiveFormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './connection-test.component.html',
  styleUrl: './connection-test.component.scss'
})
export class ConnectionTestComponent implements OnInit {
  token = '';
  testing = false;
  result: 'success' | 'failure' | null = null;
  errorDetails = '';

  form = new FormGroup({
    patientFhirId: new FormControl('', Validators.required)
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
  }

  test(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.testing = true;
    this.result = null;
    this.cdr.markForCheck();

    this.onboardingService.testConnection(this.token, this.form.value.patientFhirId!).subscribe({
      next: res => {
        this.testing = false;
        if (res.success) {
          this.result = 'success';
          this.onboardingService.getSession(this.token).subscribe(s => {
            this.sessionService.set(s);
            this.cdr.markForCheck();
          });
        } else {
          this.result = 'failure';
          this.errorDetails = res.errorDetails ?? 'Unknown error.';
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.testing = false;
        this.result = 'failure';
        this.errorDetails = err.message ?? 'Connection test failed.';
        this.cdr.markForCheck();
      }
    });
  }

  continue(): void {
    this.router.navigate(['/onboarding', this.token, 'patients-of-interest']);
  }

  goBack(): void {
    this.result = null;
    this.errorDetails = '';
    this.cdr.markForCheck();
  }
}
