import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NormalizationItem } from '../../../interfaces/onboarding.interfaces';

@Component({
  selector: 'app-normalization-grid',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './normalization-grid.component.html',
  styleUrl: './normalization-grid.component.scss'
})
export class NormalizationGridComponent {
  private readonly _items = signal<NormalizationItem[]>([]);

  @Input() set items(value: NormalizationItem[]) {
    this._items.set(value ?? []);
  }

  @Input({ required: true }) typeLabel!: (type: string) => string;
  @Input({ required: true }) isEditable!: (item: NormalizationItem) => boolean;

  @Output() editItem = new EventEmitter<NormalizationItem>();
  @Output() deleteItem = new EventEmitter<NormalizationItem>();

  readonly resourceFilter = signal<string>('');
  readonly showDisabled = signal<boolean>(true);

  readonly resourceTypes = computed(() => {
    const types = new Set<string>();
    for (const item of this._items()) {
      for (const rt of item.resourceTypes) types.add(rt);
    }
    return Array.from(types).sort();
  });

  readonly rows = computed(() => {
    const filter = this.resourceFilter();
    const showDisabled = this.showDisabled();

    return this._items()
      .filter(item => showDisabled || !item.isDisabled)
      .filter(item => !filter || item.resourceTypes.includes(filter))
      .map((item, index) => ({ item, seq: (index + 1) * 10 }));
  });

  setResourceFilter(value: string): void {
    this.resourceFilter.set(value);
  }
}
