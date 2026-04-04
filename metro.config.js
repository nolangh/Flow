const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withStorybook } = require("@storybook/react-native/metro/withStorybook");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Prevent Metro crashing when Replit deletes temp skill files mid-session
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /\/\.local\/.*/,
  /\/\.git\/.*/,
];

const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

module.exports = withStorybook(nativeWindConfig, {
  // Only bundle Storybook when explicitly enabled (keeps production builds lean)
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true",
  configPath: "./.rnstorybook",
});
