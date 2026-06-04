import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { NhsnHeaderComponent } from '../../core/nhsn-header/nhsn-header.component';
import { NhsnNavComponent } from '../../core/nhsn-nav/nhsn-nav.component';
import { OnboardingService } from '../../services/onboarding.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-onboarding-shell',
  standalone: true,
  imports: [RouterOutlet, NhsnHeaderComponent, NhsnNavComponent],
  templateUrl: './onboarding-shell.component.html',
  styleUrl: './onboarding-shell.component.scss'
})
export class OnboardingShellComponent implements OnInit {
  token = '';

  constructor(
    private route: ActivatedRoute,
    private onboardingService: OnboardingService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    // Refresh session state on shell load
    if (this.token) {
      this.onboardingService.getSession(this.token).subscribe(session => {
        this.sessionService.set(session);
      });
    }
  }
}
