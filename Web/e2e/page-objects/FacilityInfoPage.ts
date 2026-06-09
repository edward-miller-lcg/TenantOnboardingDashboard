import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class FacilityInfoPage extends BasePage {
  async goto() {
    await this.page.goto(`${this.baseUrl}/facility-info`);
    await this.waitForHeading(/facility/i);
  }

  async fill(data: {
    organizationName?: string;
    timeZone?: string;
    physicalAddress?: string;
  }) {
    if (data.organizationName) {
      await this.page.getByLabel(/organization name/i).fill(data.organizationName);
    }
    if (data.timeZone) {
      const tz = this.page.getByLabel(/time ?zone/i);
      await tz.selectOption(data.timeZone).catch(() => tz.fill(data.timeZone!));
    }
    if (data.physicalAddress) {
      await this.page.getByLabel(/address/i).fill(data.physicalAddress);
    }
  }

  async save() { await this.clickPrimary(); }
}
