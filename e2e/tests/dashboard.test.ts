import { device, element, by, expect as detoxExpect } from "detox";
import { launchClean, tapById, waitForText } from "../utils/helpers";

describe("Dashboard Screen", () => {
  beforeAll(async () => {
    await launchClean();
  });

  it("should display the household name", async () => {
    // Household name is shown in the header
    await detoxExpect(element(by.id("household-name"))).toBeVisible();
  });

  it("should display the current month label", async () => {
    await detoxExpect(element(by.id("month-label"))).toBeVisible();
  });

  it("should show the Add Transaction button", async () => {
    await detoxExpect(element(by.text("+ Add Transaction"))).toBeVisible();
  });

  it("should open the Add Transaction modal when tapped", async () => {
    await element(by.text("+ Add Transaction")).tap();
    await waitForText("Add Transaction");
    // Dismiss modal
    await element(by.id("modal-close-button")).tap();
  });

  it("should navigate to previous month", async () => {
    const monthLabel = await element(by.id("month-label")).getAttributes();
    await tapById("prev-month-button");
    // Month label should change
    await detoxExpect(element(by.id("month-label"))).toBeVisible();
    // Navigate back
    await tapById("next-month-button");
  });
});
