/**
 * withIosPrivacyManifest
 *
 * Adds a PrivacyInfo.xcprivacy file required by Apple since May 2024.
 * Without it, App Store submissions are rejected.
 *
 * Declares:
 *  - APIs the app uses that Apple considers privacy-sensitive
 *  - The reason codes for each API (visible in App Store Connect)
 *
 * Adjust NSPrivacyAccessedAPITypeReasons codes if you add new API usage.
 * Reason code registry: https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api
 */

const { withInfoPlist, withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const PRIVACY_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>

  <key>NSPrivacyTrackingDomains</key>
  <array/>

  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <!-- Financial info collected for budget tracking -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeOtherFinancialInfo</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <!-- Email address used for authentication -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <!-- Crash data via Sentry -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeCrashData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <!-- Performance data via Sentry -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePerformanceData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>

  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <!-- UserDefaults / NSUserDefaults — used by Expo internals -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <!-- File timestamp APIs — used by expo-file-system -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <!-- System boot time — used by Sentry for uptime measurement -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>35F9.1</string>
      </array>
    </dict>
    <!-- Disk space — used by Sentry for device context -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>85F4.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
`;

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withIosPrivacyManifest(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosDir = config.modRequest.platformProjectRoot;
      // The manifest lives at <AppName>/PrivacyInfo.xcprivacy
      const appName = config.modRequest.projectName ?? "Honeydo";
      const destDir = path.join(iosDir, appName);
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(path.join(destDir, "PrivacyInfo.xcprivacy"), PRIVACY_MANIFEST);
      return config;
    },
  ]);
}

module.exports = withIosPrivacyManifest;
