/**
 * Minimal no-op test sequencer to avoid pulling in @jest/test-sequencer when
 * running in constrained environments. Keeps test order as-is.
 */
class NoopTestSequencer {
  sort<T>(tests: T[]): T[] {
    return tests;
  }

  shard<T>(tests: T[]): T[] {
    return tests;
  }
}

export default NoopTestSequencer;

