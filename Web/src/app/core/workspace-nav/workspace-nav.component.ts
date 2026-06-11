import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { SessionService } from '../../services/session.service';
import { NavItem, SETUP_STEPS, MANAGE_ITEMS } from './setup-steps';

@Component({
  selector: 'app-workspace-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule],
  templateUrl: './workspace-nav.component.html',
  styleUrl: './workspace-nav.component.scss'
})
export class WorkspaceNavComponent {
  @Input() token = '';

  setupItems = SETUP_STEPS;
  manageItems = MANAGE_ITEMS;

  constructor(public sessionService: SessionService) {}

  isAccessible(item: NavItem): boolean {
    if (!item.step) return true;
    return this.sessionService.isStepAccessible(item.step);
  }

  isCompleted(item: NavItem): boolean {
    if (!item.step) return false;
    return this.sessionService.isStepCompleted(item.step);
  }
}
