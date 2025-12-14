import React from "react";
import { Card } from "@pathway/ui";

export default function PeoplePage() {
  return (
    <Card title="People / Users">
      <p className="text-sm text-text-muted">
        Placeholder for staff, volunteers, and admins list. TODO: wire to users
        API with filters and role-based visibility.
      </p>
    </Card>
  );
}
