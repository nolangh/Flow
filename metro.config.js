const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Prevent Metro crashing when Replit deletes temp skill files mid-session
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /\/\.local\/.*/,
  /\/\.git\/.*/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
