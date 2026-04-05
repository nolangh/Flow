/**
 * withAndroidNetworkSecurity
 *
 * Injects an Android Network Security Config that:
 *  - Blocks all cleartext (HTTP) traffic in production
 *  - Trusts system CAs only (not user-installed certificates)
 *  - Allows localhost cleartext for the Metro dev server
 *
 * Critical for a fintech app — prevents credentials and financial data
 * from being transmitted unencrypted or intercepted via user-installed
 * CA certificates (a common MitM attack vector).
 */

const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!--
    Block ALL cleartext (HTTP) traffic for every domain.
    Forces HTTPS for Supabase, Sentry, BetterStack, and any other API call.
  -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <!--
        Trust system CAs only.
        User-installed CAs (common for MitM proxy attacks) are NOT trusted
        in release builds — an attacker cannot install their own cert to
        intercept traffic.
      -->
      <certificates src="system" />
    </trust-anchors>
  </base-config>

  <!--
    Allow cleartext + user CAs for localhost only.
    Required so the Metro bundler can serve JS during development.
  -->
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
    <domain includeSubdomains="true">10.0.3.2</domain>
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </domain-config>
</network-security-config>
`;

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withAndroidNetworkSecurity(config) {
  // Step 1: write the XML resource file into the Android project
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, "network_security_config.xml"),
        NETWORK_SECURITY_XML
      );
      return config;
    },
  ]);

  // Step 2: reference it from AndroidManifest.xml <application>
  config = withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (app) {
      app.$ = app.$ ?? {};
      app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    }
    return config;
  });

  return config;
}

module.exports = withAndroidNetworkSecurity;
