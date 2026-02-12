/**
 * Toolkit schema snapshot — detect drift.
 */

import schema from "../content/toolkit/schema.json";

describe("Toolkit schema", () => {
  it("has expected structure", () => {
    expect(schema).toHaveProperty("version");
    expect(schema).toHaveProperty("disclaimers");
    expect(schema).toHaveProperty("templates");
    expect(Array.isArray(schema.disclaimers)).toBe(true);
    expect(Array.isArray(schema.templates)).toBe(true);
  });

  it("has all 5 templates (snapshot)", () => {
    const ids = (schema.templates as Array<{ templateId: string }>).map(
      (t) => t.templateId
    );
    expect(ids).toEqual([
      "attendance-register",
      "incident-concern-report",
      "parent-guardian-consent",
      "volunteer-onboarding-checklist",
      "weekly-safeguarding-check",
    ]);
  });

  it("includes safeguarding storage disclaimer", () => {
    const disclaimers = schema.disclaimers as string[];
    const hasStorage = disclaimers.some(
      (d) =>
        d.toLowerCase().includes("store securely") ||
        d.toLowerCase().includes("do not email")
    );
    expect(hasStorage).toBe(true);
  });
});
