// Flat config for ESLint v9+
const ts = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const unused = require("eslint-plugin-unused-imports");

module.exports = [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/.expo/**",
      "**/build/**",
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": ts,
      "unused-imports": unused,
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
