import { Component, Input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { SessionService } from '../../services/session.service';
import { UiPreferenceService } from '../../services/ui-preference.service';

@Component({
  selector: 'app-workspace-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule],
  templateUrl: './workspace-toolbar.component.html',
  styleUrl: './workspace-toolbar.component.scss'
})
export class WorkspaceToolbarComponent {
  @Input() token = '';

  constructor(
    public sessionService: SessionService,
    public uiPreference: UiPreferenceService
  ) {}

  switchToClassic(): void {
    this.uiPreference.set('legacy');
  }
}
