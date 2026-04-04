import { device, element, by, expect as detoxExpect } from "detox";
import { launchClean, navigateToTab, waitForText } from "../utils/helpers";

describe("Settings Screen", () => {
  beforeAll(async () => {
    await launchClean();
    await navigateToTab("Settings");
  });

  it("should display the Settings heading", async () => {
    await detoxExpect(element(by.text("Settings"))).toBeVisible();
  });

  it("should show the Banking section", async () => {
    await detoxExpect(element(by.text("Banking"))).toBeVisible();
  });

  it("should show Budget Alerts toggle", async () => {
    await detoxExpect(element(by.text("Budget Alerts"))).toBeVisible();
  });

  it("should show Recurring Bills section", async () => {
    await detoxExpect(element(by.text("Recurring Bills"))).toBeVisible();
  });

  it("should show Sign Out button", async () => {
    await detoxExpect(element(by.text("Sign Out"))).toBeVisible();
  });

  it("should show invite code", async () => {
    await detoxExpect(element(by.id("invite-code"))).toBeVisible();
  });

  it("should show copy button for invite code", async () => {
    await detoxExpect(element(by.text("Copy"))).toBeVisible();
  });
});
