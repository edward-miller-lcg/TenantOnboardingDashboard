import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page, protected readonly token: string) {}

  protected get baseUrl() { return `/onboarding/${this.token}`; }

  /** Wait for the page title heading to be visible. */
  async waitForHeading(text: string) {
    await this.page.getByRole('heading', { name: text }).waitFor({ state: 'visible' });
  }

  /** The primary action button ("Save & continue", "Next", etc.) */
  get primaryButton(): Locator {
    return this.page.locator('button.nhsn-btn-primary');
  }

  async clickPrimary() {
    await this.primaryButton.click();
  }

  /** Any visible error message. */
  get errorMessage(): Locator {
    return this.page.locator('.nhsn-error-msg');
  }
}
