import React from "react";
import { Card } from "@pathway/ui";

export default function SafeguardingPage() {
  return (
    <Card title="Safeguarding">
      <p className="text-sm text-text-muted">
        Placeholder for safeguarding concerns and notes. TODO: enforce
        role-gated access and audit messaging once API wiring is available.
      </p>
    </Card>
  );
}
