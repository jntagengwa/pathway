"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Child edit is now inline on the profile page.
 * Redirect /children/[childId]/edit → /children/[childId]
 */
export default function EditChildRedirectPage() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.childId) {
      router.replace(`/children/${params.childId}`);
    }
  }, [params.childId, router]);

  return null;
}
