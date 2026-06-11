import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiPreferenceService } from '../../services/ui-preference.service';

@Component({
  selector: 'app-nhsn-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nhsn-nav.component.html',
  styleUrl: './nhsn-nav.component.scss'
})
export class NhsnNavComponent {
  @Input() token = '';

  constructor(public uiPreference: UiPreferenceService) {}
}
