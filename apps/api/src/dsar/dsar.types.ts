export interface ChildDsarExport {
  child: {
    id: string;
    firstName: string;
    lastName: string;
    allergies: string | null;
    disabilities: string[];
    notes: string | null;
    group?: { id: string; name: string; minAge: number; maxAge: number } | null;
  };
  parents: Array<{
    id: string;
    email: string;
    name: string | null;
    hasFamilyAccess: boolean;
  }>;
  attendance: Array<{
    id: string;
    groupId: string;
    sessionId: string | null;
    present: boolean;
    timestamp: Date;
  }>;
  notes: Array<{
    id: string;
    text: string;
    authorId: string;
    createdAt: Date;
  }>;
  concerns: Array<{
    id: string;
    summary: string;
    details: string | null;
    createdAt: Date;
  }>;
  sessions: Array<{
    id: string;
    groupId: string | null;
    startsAt: Date;
    endsAt: Date;
    title: string | null;
  }>;
}

