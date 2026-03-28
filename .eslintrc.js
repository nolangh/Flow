module.exports = {
  extends: ["expo", "eslint:recommended"],
  plugins: [],
  rules: {
    "no-unused-vars": "warn",
    "no-console": "off",
  },
  env: {
    node: true,
  },
  ignorePatterns: ["node_modules/", "dist/", ".expo/", "supabase/functions/"],
};
