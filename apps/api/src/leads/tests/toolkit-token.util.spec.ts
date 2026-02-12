import {
  generateToolkitToken,
  hashToolkitToken,
  constantTimeEqual,
} from "../toolkit-token.util";

describe("toolkit-token.util", () => {
  describe("generateToolkitToken", () => {
    it("returns a 64-character hex string", () => {
      const token = generateToolkitToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns unique tokens on each call", () => {
      const a = generateToolkitToken();
      const b = generateToolkitToken();
      expect(a).not.toBe(b);
    });
  });

  describe("hashToolkitToken", () => {
    it("returns a deterministic hash for the same input", () => {
      const token = "abc123";
      expect(hashToolkitToken(token)).toBe(hashToolkitToken(token));
    });

    it("returns different hashes for different inputs", () => {
      const h1 = hashToolkitToken("token1");
      const h2 = hashToolkitToken("token2");
      expect(h1).not.toBe(h2);
    });

    it("returns a 64-character hex string (SHA-256)", () => {
      const hash = hashToolkitToken("test");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("never returns the raw token", () => {
      const token = "secret-token-123";
      const hash = hashToolkitToken(token);
      expect(hash).not.toBe(token);
      expect(hash).not.toContain(token);
    });
  });

  describe("constantTimeEqual", () => {
    it("returns true for equal strings", () => {
      expect(constantTimeEqual("abc", "abc")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      expect(constantTimeEqual("abc", "abd")).toBe(false);
    });

    it("returns false for different lengths", () => {
      expect(constantTimeEqual("ab", "abc")).toBe(false);
    });

    it("returns false for empty vs non-empty", () => {
      expect(constantTimeEqual("", "a")).toBe(false);
    });
  });
});
