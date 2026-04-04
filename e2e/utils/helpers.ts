import { device, element, by, expect as detoxExpect, waitFor } from "detox";

/** Wait for an element with the given test ID to be visible. */
export async function waitForId(testId: string, timeout = 5000) {
  await waitFor(element(by.id(testId)))
    .toBeVisible()
    .withTimeout(timeout);
}

/** Wait for an element with the given text to be visible. */
export async function waitForText(text: string, timeout = 5000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

/** Tap an element by test ID. */
export async function tapById(testId: string) {
  await element(by.id(testId)).tap();
}

/** Type text into an element by test ID. */
export async function typeIntoId(testId: string, text: string) {
  await element(by.id(testId)).typeText(text);
}

/** Navigate to a specific tab by its label. */
export async function navigateToTab(label: string) {
  await element(by.text(label)).tap();
  await waitForText(label);
}

/** Launch the app in a clean state. */
export async function launchClean() {
  await device.launchApp({ newInstance: true, delete: false });
}
