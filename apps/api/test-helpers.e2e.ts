/**
 * Helper function to check if database is available for e2e tests.
 * Returns true if database is available, false otherwise.
 * Should be used at the start of beforeAll hooks to skip tests gracefully.
 */
export function isDatabaseAvailable(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).__E2E_DB_AVAILABLE === true;
}
