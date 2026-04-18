import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import path from 'path';

const { Given, When, Then } = createBdd();

async function triggerNameChangeFlow(page: import('@playwright/test').Page) {
  await page.getByPlaceholder('Ask about HR policies, leave, or procedures\u2026')
    .fill('I would like to change my last name');
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.locator('button.rounded-full').filter({ hasText: 'Start Name Change Request' })
  ).toBeVisible({ timeout: 60_000 });
}

Given('I have triggered the name change flow', async ({ page }) => {
  await triggerNameChangeFlow(page);
});

When('I click the {string} action chip', async ({ page }, chipLabel: string) => {
  await page.locator('button.rounded-full').filter({ hasText: chipLabel }).click();
});

Then('the name change form is visible', async ({ page }) => {
  // The side panel opens alongside the chat — look for its heading
  await expect(page.locator('h2').filter({ hasText: 'Legal Name Change' })).toBeVisible({ timeout: 15_000 });
});

Then('I see a field for the new last name', async ({ page }) => {
  await expect(page.getByPlaceholder('Enter your new last name')).toBeVisible();
});

Then('I see a submit button', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Submit Name Change Request' })).toBeVisible();
});

Given('I have opened the name change form', async ({ page }) => {
  await page.locator('button.rounded-full').filter({ hasText: 'Start Name Change Request' }).click();
  await expect(page.locator('h2').filter({ hasText: 'Legal Name Change' })).toBeVisible({ timeout: 15_000 });
  // Wait for the remote MFE to load
  await expect(page.getByPlaceholder('Enter your new last name')).toBeVisible({ timeout: 20_000 });
});

When('I enter {string} as the new last name', async ({ page }, lastName: string) => {
  await page.getByPlaceholder('Enter your new last name').fill(lastName);
});

When('I select {string} as the document type', async ({ page }, docType: string) => {
  // No id on the select; find by its sibling label text context
  await page.locator('select').selectOption({ label: docType });
});

When('I upload a supporting document', async ({ page }) => {
  const stubFile = path.join(__dirname, '../fixtures/stub.pdf');
  await page.locator('input[type="file"]').setInputFiles(stubFile);
});

When('I submit the name change form', async ({ page }) => {
  // Mock the HR service API call for reliable test results
  await page.route('**/name-change**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        request_id: 'TEST-2024-001',
        status: 'pending',
        message: 'Name change request submitted successfully',
      }),
    });
  });
  await page.getByRole('button', { name: 'Submit Name Change Request' }).click();
});

Then('I see a submission confirmation', async ({ page }) => {
  // NameChangeSidePanel shows a success state with "Request Submitted!" text
  await expect(
    page.getByText('Request Submitted!').or(
      page.getByText('submitted').or(
        page.getByText('Request ID')
      )
    )
  ).toBeVisible({ timeout: 30_000 });
});
