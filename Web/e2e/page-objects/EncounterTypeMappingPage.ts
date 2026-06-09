import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EncounterTypeMappingPage extends BasePage {
  async goto() {
    await this.page.goto(`${this.baseUrl}/encounter-type-mapping`);
    await this.waitForHeading(/encounter/i);
  }

  async fillSourceSystem(uri: string, mapIndex = 0) {
    const inputs = this.page.locator('.code-system-map-box').nth(mapIndex).getByLabel(/source system uri/i);
    await inputs.fill(uri);
  }

  async addCodeRow(sourceCode: string, snomedCode: string, mapIndex = 0) {
    const box = this.page.locator('.code-system-map-box').nth(mapIndex);
    await box.getByRole('button', { name: /add row/i }).click();
    const rows = box.locator('tbody tr');
    const lastRow = rows.last();
    await lastRow.locator('input').first().fill(sourceCode);
    await lastRow.locator('select').selectOption(snomedCode);
  }

  async assertAutoCreatedConditionalTransformInfo() {
    await expect(this.page.locator('.info-box')).toContainText(/conditional transform/i);
  }

  async save() { await this.clickPrimary(); }
}
