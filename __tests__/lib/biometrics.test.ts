import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import {
  biometricAvailable,
  biometricTypes,
  saveCredentials,
  loadCredentials,
  clearCredentials,
  authenticateWithBiometric,
} from "@/lib/biometrics";

beforeEach(() => jest.clearAllMocks());

// ─── biometricAvailable ─────────────────────────────────────────────────────

describe("biometricAvailable", () => {
  it("returns true when hardware exists and user is enrolled", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
    expect(await biometricAvailable()).toBe(true);
  });

  it("returns false when hardware is absent", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
    expect(await biometricAvailable()).toBe(false);
  });

  it("returns false when user is not enrolled", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(false);
    expect(await biometricAvailable()).toBe(false);
  });

  it("returns false when neither hardware nor enrollment", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(false);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(false);
    expect(await biometricAvailable()).toBe(false);
  });
});

// ─── biometricTypes ─────────────────────────────────────────────────────────

describe("biometricTypes", () => {
  it("delegates to supportedAuthenticationTypesAsync", async () => {
    const types = [1, 2];
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValueOnce(types);
    const result = await biometricTypes();
    expect(result).toEqual(types);
  });
});

// ─── saveCredentials / loadCredentials / clearCredentials ───────────────────

describe("credential storage", () => {
  it("saveCredentials stores JSON in SecureStore", async () => {
    await saveCredentials("user@example.com", "secret123");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "honeydo_biometric_creds",
      JSON.stringify({ email: "user@example.com", password: "secret123" })
    );
  });

  it("loadCredentials returns parsed credentials", async () => {
    const stored = JSON.stringify({ email: "user@example.com", password: "secret123" });
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(stored);
    const result = await loadCredentials();
    expect(result).toEqual({ email: "user@example.com", password: "secret123" });
  });

  it("loadCredentials returns null when nothing is stored", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const result = await loadCredentials();
    expect(result).toBeNull();
  });

  it("loadCredentials returns null on parse error", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("not-json{{{");
    const result = await loadCredentials();
    expect(result).toBeNull();
  });

  it("clearCredentials calls deleteItemAsync", async () => {
    await clearCredentials();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("honeydo_biometric_creds");
  });

  it("clearCredentials does not throw if key does not exist", async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error("not found"));
    await expect(clearCredentials()).resolves.toBeUndefined();
  });
});

// ─── authenticateWithBiometric ──────────────────────────────────────────────

describe("authenticateWithBiometric", () => {
  it("returns true on successful authentication", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true });
    expect(await authenticateWithBiometric()).toBe(true);
  });

  it("returns false on failed authentication", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: false });
    expect(await authenticateWithBiometric()).toBe(false);
  });

  it("uses default prompt message", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true });
    await authenticateWithBiometric();
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: "Sign in to Honeydo" })
    );
  });

  it("accepts a custom prompt message", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({ success: true });
    await authenticateWithBiometric("Verify your identity");
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: "Verify your identity" })
    );
  });
});
