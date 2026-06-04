import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { OnboardingService } from '../services/onboarding.service';
import { CreateSessionResponse, SessionResponse } from '../interfaces/onboarding.interfaces';
import { NhsnHeaderComponent } from '../core/nhsn-header/nhsn-header.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, NhsnHeaderComponent, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  form = new FormGroup({
    nhsnOrgId: new FormControl('', [Validators.required, Validators.pattern(/^\d{1,10}$/)]),
    healthSystemName: new FormControl('', Validators.required)
  });

  sessions: SessionResponse[] = [];
  lastCreated: CreateSessionResponse | null = null;
  loading = false;
  error = '';
  copied = false;

  constructor(private onboardingService: OnboardingService) {
    this.loadSessions();
  }

  loadSessions(): void {
    this.onboardingService.getSessions().subscribe({
      next: s => this.sessions = s,
      error: () => {}
    });
  }

  generate(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.onboardingService.createSession({
      nhsnOrgId: this.form.value.nhsnOrgId!,
      healthSystemName: this.form.value.healthSystemName!
    }).subscribe({
      next: result => {
        this.lastCreated = result;
        this.loading = false;
        this.loadSessions();
        this.form.reset();
      },
      error: err => {
        this.error = err.message ?? 'Failed to create session.';
        this.loading = false;
      }
    });
  }

  copyUrl(): void {
    if (!this.lastCreated) return;
    navigator.clipboard.writeText(this.lastCreated.onboardingUrl).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
