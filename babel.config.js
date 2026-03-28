module.exports = function (api) {
  api.cache(true);
  // Use process.env directly to avoid conflict with api.cache()
  const isTest = process.env.NODE_ENV === "test";

  return {
    presets: [
      [
        "babel-preset-expo",
        // NativeWind's jsxImportSource breaks jest — use react in test env
        { jsxImportSource: isTest ? "react" : "nativewind" },
      ],
    ],
    plugins: [
      // These plugins are not compatible with jest — skip in test env
      ...(isTest ? [] : [
        require("./node_modules/react-native-css-interop/dist/babel-plugin").default,
        ["@babel/plugin-transform-react-jsx", { runtime: "automatic", importSource: "react-native-css-interop" }],
        "react-native-worklets/plugin",
        "nativewind/babel",
      ]),
    ],
  };
};
