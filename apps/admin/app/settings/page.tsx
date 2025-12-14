import React from "react";
import { Card } from "@pathway/ui";

export default function SettingsPage() {
  return (
    <Card title="Settings">
      <p className="text-sm text-text-muted">
        Placeholder for organisation settings. TODO: add org switcher wiring,
        environment notices, and permission-aware controls.
      </p>
    </Card>
  );
}
