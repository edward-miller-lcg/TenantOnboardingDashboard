import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ComplianceAttestationPage extends BasePage {
  static readonly STEP = 'ComplianceAttestation';

  async goto() {
    await this.page.goto(`${this.baseUrl}/compliance-attestation`);
    await this.waitForHeading(/compliance|attestation/i);
  }

  async complete() {
    await this.clickPrimary();
  }
}
