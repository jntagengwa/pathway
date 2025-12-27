/**
 * No Access Card
 * 
 * Displayed when a user tries to access a page they don't have permission for.
 */

"use client";

import React from "react";
import Link from "next/link";
import { Card, Button } from "@pathway/ui";
import { ShieldAlert } from "lucide-react";

export type NoAccessCardProps = {
  title?: string;
  message?: string;
  showBackButton?: boolean;
};

export const NoAccessCard: React.FC<NoAccessCardProps> = ({
  title = "You don't have access to this section",
  message = "This section is only available to administrators.",
  showBackButton = true,
}) => {
  return (
    <Card className="max-w-2xl">
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-6 w-6 text-text-muted" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <p className="text-sm text-text-muted">{message}</p>
        </div>
        {showBackButton && (
          <Link href="/">
            <Button variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};

