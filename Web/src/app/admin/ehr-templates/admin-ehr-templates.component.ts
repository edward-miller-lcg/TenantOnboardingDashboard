import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';
import { EhrTemplateCategory, EhrVendorTemplate, EhrVendorTemplateRequest } from '../../interfaces/onboarding.interfaces';

const EMPTY_FORM: EhrVendorTemplateRequest = {
  vendor: '',
  category: 'Normalization',
  resourceType: '',
  name: '',
  description: '',
  definitionJson: '{}',
  sequence: 10,
  isActive: true
};

@Component({
  selector: 'app-admin-ehr-templates',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-ehr-templates.component.html',
  styleUrl: './admin-ehr-templates.component.scss'
})
export class AdminEhrTemplatesComponent implements OnInit {
  readonly vendors = signal<string[]>([]);
  readonly selectedVendor = signal<string>('');
  readonly newVendorName = signal<string>('');
  readonly category = signal<EhrTemplateCategory>('Normalization');
  readonly templates = signal<EhrVendorTemplate[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly editing = signal<EhrVendorTemplate | null>(null);
  readonly isCreating = signal(false);
  form: EhrVendorTemplateRequest = { ...EMPTY_FORM };
  formError = '';

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit(): void {
    this.loadVendors();
  }

  loadVendors(): void {
    this.onboardingService.getEhrTemplateVendors().subscribe({
      next: vendors => {
        this.vendors.set(vendors);
        if (!this.selectedVendor() && vendors.length > 0) {
          this.selectedVendor.set(vendors[0]);
          this.loadTemplates();
        }
      },
      error: () => this.error.set('Failed to load vendors.')
    });
  }

  selectVendor(vendor: string): void {
    this.selectedVendor.set(vendor);
    this.closeForm();
    this.loadTemplates();
  }

  selectCategory(category: EhrTemplateCategory): void {
    this.category.set(category);
    this.closeForm();
    this.loadTemplates();
  }

  loadTemplates(): void {
    const vendor = this.selectedVendor();
    if (!vendor) { this.templates.set([]); return; }

    this.loading.set(true);
    this.error.set('');
    this.onboardingService.getEhrTemplates(vendor, this.category()).subscribe({
      next: templates => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load templates.');
        this.loading.set(false);
      }
    });
  }

  addVendor(): void {
    const name = this.newVendorName().trim();
    if (!name) return;

    if (!this.vendors().includes(name)) {
      this.vendors.set([...this.vendors(), name].sort());
    }
    this.selectedVendor.set(name);
    this.newVendorName.set('');
    this.templates.set([]);
    this.addNew();
  }

  addNew(): void {
    this.editing.set(null);
    this.isCreating.set(true);
    this.formError = '';
    this.form = {
      ...EMPTY_FORM,
      vendor: this.selectedVendor(),
      category: this.category(),
      sequence: this.nextSequence()
    };
  }

  edit(template: EhrVendorTemplate): void {
    this.editing.set(template);
    this.isCreating.set(false);
    this.formError = '';
    this.form = {
      vendor: template.vendor,
      category: template.category,
      resourceType: template.resourceType,
      name: template.name,
      description: template.description ?? '',
      definitionJson: template.definitionJson,
      sequence: template.sequence,
      isActive: template.isActive
    };
  }

  closeForm(): void {
    this.editing.set(null);
    this.isCreating.set(false);
    this.formError = '';
  }

  save(): void {
    if (!this.form.vendor || !this.form.resourceType || !this.form.name) {
      this.formError = 'Vendor, Resource Type, and Name are required.';
      return;
    }

    try {
      JSON.parse(this.form.definitionJson);
    } catch {
      this.formError = 'Definition JSON is not valid JSON.';
      return;
    }

    const editing = this.editing();
    const request$ = editing
      ? this.onboardingService.updateEhrTemplate(editing.id, this.form)
      : this.onboardingService.createEhrTemplate(this.form);

    request$.subscribe({
      next: () => {
        this.closeForm();
        this.loadVendors();
        this.loadTemplates();
      },
      error: () => this.formError = 'Failed to save template.'
    });
  }

  delete(template: EhrVendorTemplate): void {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    this.onboardingService.deleteEhrTemplate(template.id).subscribe({
      next: () => this.loadTemplates(),
      error: () => this.error.set('Failed to delete template.')
    });
  }

  private nextSequence(): number {
    const items = this.templates().filter(t => t.resourceType === this.form?.resourceType);
    const max = items.reduce((acc, t) => Math.max(acc, t.sequence), 0);
    return max + 10;
  }
}
