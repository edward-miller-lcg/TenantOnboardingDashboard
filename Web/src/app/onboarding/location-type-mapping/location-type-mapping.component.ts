import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';
import { OnboardingBreadcrumbComponent } from '../../core/onboarding-breadcrumb/onboarding-breadcrumb.component';

@Component({
  selector: 'app-location-type-mapping',
  standalone: true,
  imports: [FormsModule, OnboardingBreadcrumbComponent],
  templateUrl: './location-type-mapping.component.html',
  styleUrl: './location-type-mapping.component.scss'
})
export class LocationTypeMappingComponent implements OnInit {
  token = '';
  confirmed = false;
  saving = false;

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

  save(): void {
    if (!this.confirmed) return;
    this.saving = true;
    this.onboardingService.completeLocationTypeMapping(this.token).subscribe({
      next: () => {
        this.onboardingService.getSession(this.token).subscribe(s => {
          this.sessionService.set(s);
          this.router.navigate(['/onboarding', this.token, 'encounter-type-mapping']);
        });
      },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
