import { device, element, by, expect as detoxExpect } from "detox";
import { navigateToTab, launchClean, waitForText } from "../utils/helpers";

describe("Tab Navigation", () => {
  beforeAll(async () => {
    await launchClean();
  });

  it("should land on the Dashboard (Home) tab on launch", async () => {
    await detoxExpect(element(by.text("Home"))).toBeVisible();
  });

  it("should navigate to Budget tab", async () => {
    await navigateToTab("Budget");
    await detoxExpect(element(by.text("Budget"))).toBeVisible();
  });

  it("should navigate to Lists tab", async () => {
    await navigateToTab("Lists");
    await detoxExpect(element(by.text("Lists"))).toBeVisible();
  });

  it("should navigate to Goals tab", async () => {
    await navigateToTab("Goals");
    await detoxExpect(element(by.text("Goals"))).toBeVisible();
  });

  it("should navigate to Settings tab", async () => {
    await navigateToTab("Settings");
    await detoxExpect(element(by.text("Settings"))).toBeVisible();
  });

  it("should navigate back to Home tab", async () => {
    await navigateToTab("Home");
    await detoxExpect(element(by.text("Home"))).toBeVisible();
  });
});
