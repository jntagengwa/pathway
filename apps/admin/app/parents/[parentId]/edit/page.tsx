"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Parent edit is now inline on the profile page.
 * Redirect /parents/[parentId]/edit → /parents/[parentId]
 */
export default function EditParentRedirectPage() {
  const params = useParams<{ parentId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.parentId) {
      router.replace(`/parents/${params.parentId}`);
    }
  }, [params.parentId, router]);

  return null;
}
