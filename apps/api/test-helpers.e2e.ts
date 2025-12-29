/**
 * Helper function to check if database is available for e2e tests.
 * Returns true if database is available, false otherwise.
 * Should be used at the start of beforeAll hooks to skip tests gracefully.
 */
export function isDatabaseAvailable(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).__E2E_DB_AVAILABLE === true;
}

/**
 * Helper function to skip tests if database is not available.
 * Call this at the start of beforeAll hooks.
 * Returns true if database is available, false otherwise.
 * Tests should check the return value and return early if false.
 */
export function requireDatabase(): boolean {
  if (!isDatabaseAvailable()) {
    console.warn(
      "[test-helpers.e2e] Database is not available. Tests will be skipped.",
    );
    return false;
  }
  return true;
}
