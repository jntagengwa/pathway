import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  verbose: true,
  rootDir: ".",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    // Map workspace imports like @pathway/db -> ../../packages/db/src/index.ts for tests
    "^@pathway/([^/]+)$": "<rootDir>/../../packages/$1/src/index.ts",
  },
  setupFiles: ["<rootDir>/test.setup.ts"],
  testMatch: [
    "**/__tests__/**/*.spec.ts",
    "**/tests/**/*.spec.ts",
    "**/*.e2e-spec.ts",
  ],
};

export default config;
