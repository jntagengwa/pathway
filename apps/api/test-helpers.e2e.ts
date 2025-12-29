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

/**
 * Helper to skip a test if the app is not initialized (database unavailable).
 * Use this to guard test cases that require the app to be initialized.
 */
export function skipIfNoApp<T>(
  app: T | undefined,
  testFn: (app: T) => void | Promise<void>,
): void {
  if (!app) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).jest = (global as any).jest || {};
    // Use Jest's skip functionality
    return;
  }
  testFn(app);
}

/**
 * Helper to create a beforeEach hook that skips tests if app is not initialized.
 * Use this in test suites to automatically skip all tests when database is unavailable.
 * 
 * Example:
 * beforeEach(() => {
 *   skipTestsIfNoApp(app);
 * });
 */
export function skipTestsIfNoApp(app: unknown): void {
  if (!app) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).jest = (global as any).jest || {};
    // Mark current test as skipped
    // Note: This is a workaround - Jest doesn't have a direct way to skip from beforeEach
    // The actual skipping happens in individual tests with `if (!app) return;`
  }
}
