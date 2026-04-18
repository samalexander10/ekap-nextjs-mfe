import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the chat page', async ({ page }) => {
  // Chat lives at /chat in the Next.js App Router
  await page.goto('/chat');
  await expect(
    page.getByPlaceholder('Ask about HR policies, leave, or procedures\u2026')
  ).toBeVisible();
});

Then('the chat input field is visible', async ({ page }) => {
  await expect(
    page.getByPlaceholder('Ask about HR policies, leave, or procedures\u2026')
  ).toBeVisible();
});

Then('the send button is visible', async ({ page }) => {
  await expect(page.locator('form button[type="submit"]')).toBeVisible();
});

When('I type {string} in the chat', async ({ page }, message: string) => {
  await page.getByPlaceholder('Ask about HR policies, leave, or procedures\u2026').fill(message);
});

When('I send the message', async ({ page }) => {
  await page.locator('form button[type="submit"]').click();
});

Then('my message appears in the chat', async ({ page }) => {
  // User messages appear in the chat list
  await expect(page.getByText('What is the vacation policy?')).toBeVisible({ timeout: 10_000 });
});

Then('I receive a response from the assistant', async ({ page }) => {
  // The submit button re-enables when streaming is complete
  await expect(page.locator('form button[type="submit"]')).toBeEnabled({ timeout: 60_000 });
  // The assistant message bubble has the chat-prose class
  await expect(page.locator('.chat-prose').last()).toBeVisible();
});

Then('a {string} action chip appears', async ({ page }, chipLabel: string) => {
  await expect(
    page.locator('button.rounded-full').filter({ hasText: chipLabel })
  ).toBeVisible({ timeout: 60_000 });
});
