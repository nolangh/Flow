import { device, element, by, expect as detoxExpect } from "detox";
import { launchClean, navigateToTab, waitForText, typeIntoId, tapById } from "../utils/helpers";

describe("Budget Screen", () => {
  beforeAll(async () => {
    await launchClean();
    await navigateToTab("Budget");
  });

  it("should display the Budget heading", async () => {
    await detoxExpect(element(by.text("Budget"))).toBeVisible();
  });

  it("should show Income and Spending sections", async () => {
    await detoxExpect(element(by.text("Income"))).toBeVisible();
    await detoxExpect(element(by.text("Spending"))).toBeVisible();
  });

  it("should open Add Category modal", async () => {
    await element(by.text("Add Category")).tap();
    await waitForText("New Category");
    await element(by.id("modal-close-button")).tap();
  });

  it("should open Add Transaction modal", async () => {
    await element(by.text("+ Add Transaction")).tap();
    await waitForText("Add Transaction");
    await element(by.id("modal-close-button")).tap();
  });

  it("should switch to History tab", async () => {
    await element(by.text("History")).tap();
    await detoxExpect(element(by.id("transactions-list"))).toBeVisible();
  });

  it("should switch back to Overview tab", async () => {
    await element(by.text("Overview")).tap();
    await detoxExpect(element(by.text("Income"))).toBeVisible();
  });

  describe("Add Category — valid input", () => {
    it("should add a new expense category", async () => {
      await element(by.text("Add Category")).tap();
      await waitForText("New Category");

      await element(by.id("category-name-input")).typeText("Test Category");
      await element(by.id("category-limit-input")).typeText("300");

      await element(by.text("Save")).tap();
      await waitForText("Test Category");
    });
  });
});
