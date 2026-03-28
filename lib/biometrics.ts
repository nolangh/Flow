import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

const CREDS_KEY = "flow_biometric_creds";

export interface StoredCredentials {
  email: string;
  password: string;
}

export async function biometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function biometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
  return LocalAuthentication.supportedAuthenticationTypesAsync();
}

export async function saveCredentials(email: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify({ email, password }));
}

export async function loadCredentials(): Promise<StoredCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(CREDS_KEY);
    return raw ? (JSON.parse(raw) as StoredCredentials) : null;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDS_KEY).catch(() => {});
}

export async function authenticateWithBiometric(promptMessage = "Sign in to Flow"): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: "Use password",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}
