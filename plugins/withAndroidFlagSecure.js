/**
 * withAndroidFlagSecure
 *
 * Sets WindowManager.LayoutParams.FLAG_SECURE on the main Android Activity.
 *
 * Effect:
 *  - Prevents screenshots and screen recordings of the app
 *  - Prevents the app from appearing in the Recent Apps thumbnail
 *  - Blocks screen-capture malware from reading the display buffer
 *
 * This is standard practice for banking and fintech apps. Users will see
 * a blank screen if they try to screenshot — inform them in onboarding.
 *
 * Only applied in production builds (when __DEV__ is false at native level).
 * The check is done by reading the BuildConfig.DEBUG flag.
 */

const { withMainActivity } = require("@expo/config-plugins");

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withAndroidFlagSecure(config) {
  return withMainActivity(config, (config) => {
    const { language, contents } = config.modResults;

    if (contents.includes("FLAG_SECURE")) return config; // already applied

    if (language === "java") {
      let result = contents;

      // Add import if missing
      if (!result.includes("import android.view.WindowManager;")) {
        result = result.replace(
          "import android.os.Bundle;",
          "import android.os.Bundle;\nimport android.view.WindowManager;"
        );
      }

      // Add FLAG_SECURE in onCreate, after super.onCreate — only in release
      result = result.replace(
        /super\.onCreate\(null\);/,
        `super.onCreate(null);
    // Prevent screenshots and screen recordings in release builds (fintech best practice)
    if (!BuildConfig.DEBUG) {
      getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
      );
    }`
      );

      // Ensure BuildConfig import
      if (!result.includes("import " + config.modResults.language)) {
        // BuildConfig is in the same package, no explicit import needed
      }

      config.modResults.contents = result;
    } else if (language === "kotlin") {
      let result = contents;

      if (!result.includes("import android.view.WindowManager")) {
        result = result.replace(
          "import android.os.Bundle",
          "import android.os.Bundle\nimport android.view.WindowManager"
        );
      }

      result = result.replace(
        /super\.onCreate\(null\)/,
        `super.onCreate(null)
    // Prevent screenshots and screen recordings in release builds (fintech best practice)
    if (!BuildConfig.DEBUG) {
      window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
      )
    }`
      );

      config.modResults.contents = result;
    }

    return config;
  });
}

module.exports = withAndroidFlagSecure;
