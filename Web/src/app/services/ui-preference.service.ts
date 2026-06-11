import { Injectable, signal } from '@angular/core';

export type ShellMode = 'legacy' | 'modern';
export type NormalizationViewMode = 'guided' | 'grid';

const SHELL_STORAGE_KEY = 'onboarding-shell-mode';
const NORMALIZATION_VIEW_STORAGE_KEY = 'onboarding-normalization-view';

@Injectable({ providedIn: 'root' })
export class UiPreferenceService {
  private readonly _shellMode = signal<ShellMode>(this.loadInitial(SHELL_STORAGE_KEY, 'modern', 'legacy'));
  private readonly _normalizationView = signal<NormalizationViewMode>(
    this.loadInitial(NORMALIZATION_VIEW_STORAGE_KEY, 'grid', 'guided')
  );

  readonly shellMode = this._shellMode.asReadonly();
  readonly normalizationView = this._normalizationView.asReadonly();

  set(mode: ShellMode): void {
    this._shellMode.set(mode);
    localStorage.setItem(SHELL_STORAGE_KEY, mode);
  }

  toggle(): void {
    this.set(this._shellMode() === 'modern' ? 'legacy' : 'modern');
  }

  setNormalizationView(mode: NormalizationViewMode): void {
    this._normalizationView.set(mode);
    localStorage.setItem(NORMALIZATION_VIEW_STORAGE_KEY, mode);
  }

  private loadInitial<T extends string>(key: string, matchValue: T, fallback: T): T {
    return localStorage.getItem(key) === matchValue ? matchValue : fallback;
  }
}
