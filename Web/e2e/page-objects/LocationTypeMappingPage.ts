import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LocationTypeMappingPage extends BasePage {
  async goto() {
    await this.page.goto(`${this.baseUrl}/location-type-mapping`);
    await this.waitForHeading(/location/i);
  }

  /** Fill the source system URI field. */
  async fillSourceSystem(uri: string) {
    await this.page.getByLabel(/source system uri/i).fill(uri);
  }

  /** Add a single code row (append to end of table). */
  async addCodeRow(sourceCode: string, hslocCode: string, display?: string) {
    await this.page.getByRole('button', { name: /add row/i }).click();
    const rows = this.page.locator('tbody tr');
    const lastRow = rows.last();
    await lastRow.locator('input').nth(0).fill(sourceCode);
    await lastRow.locator('input').nth(1).fill(hslocCode);
    if (display) await lastRow.locator('input').nth(2).fill(display);
  }

  /** Fill the table from an array of mappings (replaces existing rows). */
  async fillMappings(mappings: { sourceCode: string; targetCode: string; display?: string }[]) {
    await this.fillSourceSystem('urn:test:location:system');

    // Clear existing rows except the first, fill from data
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();

    for (let i = 0; i < mappings.length; i++) {
      if (i >= count) await this.page.getByRole('button', { name: /add row/i }).click();
      const row = rows.nth(i);
      await row.locator('input').nth(0).fill(mappings[i].sourceCode);
      await row.locator('input').nth(1).fill(mappings[i].targetCode);
      if (mappings[i].display) await row.locator('input').nth(2).fill(mappings[i].display!);
    }
  }

  async assertSourceSystemRequired() {
    await this.clickPrimary();
    await expect(this.errorMessage.first()).toBeVisible();
  }

  async save() { await this.clickPrimary(); }
}
