import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { NavItem, SETUP_STEPS } from '../workspace-nav/setup-steps';

@Component({
  selector: 'app-workspace-stepper',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './workspace-stepper.component.html',
  styleUrl: './workspace-stepper.component.scss'
})
export class WorkspaceStepperComponent {
  @Input() token = '';
  @Input() currentPath = '';

  readonly steps = SETUP_STEPS;

  constructor(public sessionService: SessionService) {}

  isAccessible(step: NavItem): boolean {
    return !step.step || this.sessionService.isStepAccessible(step.step);
  }

  isCompleted(step: NavItem): boolean {
    return !!step.step && this.sessionService.isStepCompleted(step.step);
  }

  isCurrent(step: NavItem): boolean {
    return step.path === this.currentPath;
  }
}
