import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NormalizationsPage extends BasePage {
  async goto() {
    await this.page.goto(`${this.baseUrl}/normalizations`);
    await this.waitForHeading(/normalization/i);
  }

  /** All operation rows rendered in the list. */
  get operationRows(): Locator {
    return this.page.locator('.norm-item');
  }

  /** Find a row by its name text. */
  rowByName(name: string): Locator {
    return this.page.locator('.norm-item', { hasText: name });
  }

  async assertOperationVisible(name: string) {
    await expect(this.rowByName(name)).toBeVisible();
  }

  async assertOperationCount(count: number) {
    await expect(this.operationRows).toHaveCount(count);
  }

  async assertResourceTypeBadge(operationName: string, resourceType: string) {
    const row = this.rowByName(operationName);
    await expect(row.locator('.norm-badge--resource', { hasText: resourceType })).toBeVisible();
  }

  async assertTypeBadge(operationName: string, typeLabel: string) {
    const row = this.rowByName(operationName);
    await expect(row.locator('.norm-badge', { hasText: typeLabel })).toBeVisible();
  }

  async deleteOperation(name: string) {
    const row = this.rowByName(name);
    this.page.once('dialog', d => d.accept());
    await row.getByRole('button', { name: /delete/i }).click();
  }

  async clickEdit(name: string) {
    await this.rowByName(name).getByRole('button', { name: /edit/i }).click();
  }

  async openAddMenu() {
    await this.page.getByRole('button', { name: /add normalization/i }).click();
  }

  async addCodeMap() {
    await this.openAddMenu();
    await this.page.getByRole('button', { name: /code map/i }).first().click();
  }

  async addCopyProperty() {
    await this.openAddMenu();
    await this.page.getByRole('button', { name: /copy property/i }).click();
  }

  async addConditionalTransform() {
    await this.openAddMenu();
    await this.page.getByRole('button', { name: /conditional transform/i }).click();
  }
}
