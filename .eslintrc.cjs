/** Root baseline; app/package configs can extend later */
module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "unused-imports"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "unused-imports/no-unused-imports": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  ignorePatterns: ["dist", ".next", "node_modules"]
};
