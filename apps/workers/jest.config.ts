import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  verbose: true,
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.spec.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@pathway/([^/]+)$": "<rootDir>/../../packages/$1/src/index.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/test.setup.ts"],
  testMatch: ["**/tests/**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testTimeout: 10000, // Increase timeout for tests that may need database setup
};

export default config;

