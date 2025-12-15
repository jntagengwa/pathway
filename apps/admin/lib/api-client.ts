export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333";

export type AdminSessionRow = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  ageGroup: string;
  room: string;
  status: "not_started" | "in_progress" | "completed";
  attendanceMarked: number;
  attendanceTotal: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  leadStaff?: string;
  supportStaff?: string[];
};

export type AdminChildRow = {
  id: string;
  fullName: string;
  preferredName?: string | null;
  ageGroup?: string | null;
  primaryGroup?: string | null;
  hasPhotoConsent: boolean;
  hasAllergies: boolean;
  hasAdditionalNeeds: boolean;
  status: "active" | "inactive";
};

export type AdminParentRow = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  children: { id: string; name: string }[];
  childrenCount?: number;
  isPrimaryContact: boolean;
  status: "active" | "inactive";
};

function buildAuthHeaders(): HeadersInit {
  // TODO: integrate with real Auth0 auth flow and PathwayRequestContext-friendly tokens.
  // TODO: ensure tenant/org scoping comes from JWT, not user-provided values.
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (process.env.NEXT_PUBLIC_DEV_BEARER_TOKEN) {
    headers["Authorization"] =
      `Bearer ${process.env.NEXT_PUBLIC_DEV_BEARER_TOKEN}`;
  }

  return headers;
}

// TODO: wire real fetch with auth headers (PathwayRequestContext / Auth0)
export async function fetchSessionsMock(): Promise<AdminSessionRow[]> {
  return Promise.resolve([
    {
      id: "s1",
      title: "Year 3 Maths",
      startsAt: "2025-01-15T09:00:00Z",
      endsAt: "2025-01-15T09:50:00Z",
      ageGroup: "Year 3",
      room: "Room 12",
      status: "not_started",
      attendanceMarked: 0,
      attendanceTotal: 24,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      leadStaff: "Ms. Patel",
      supportStaff: ["Mr. Green"],
    },
    {
      id: "s2",
      title: "Year 5 Science",
      startsAt: "2025-01-15T11:00:00Z",
      endsAt: "2025-01-15T11:50:00Z",
      ageGroup: "Year 5",
      room: "Lab 2",
      status: "in_progress",
      attendanceMarked: 8,
      attendanceTotal: 22,
      presentCount: 8,
      absentCount: 2,
      lateCount: 0,
      leadStaff: "Dr. Hughes",
      supportStaff: ["Ms. Wong"],
    },
    {
      id: "s3",
      title: "After-school Coding Club",
      startsAt: "2025-01-15T15:30:00Z",
      endsAt: "2025-01-15T16:30:00Z",
      ageGroup: "Mixed Years 4-6",
      room: "ICT Suite",
      status: "completed",
      attendanceMarked: 18,
      attendanceTotal: 18,
      presentCount: 17,
      absentCount: 1,
      lateCount: 0,
      leadStaff: "Mr. Ali",
      supportStaff: ["Ms. Brown"],
    },
  ]);
}

// TODO: replace mock lookup with real API call using tenant-scoped endpoint and auth headers
export async function fetchSessionById(
  id: string,
): Promise<AdminSessionRow | null> {
  const all = await fetchSessionsMock();
  return all.find((s) => s.id === id) ?? null;
}

// Uses real API when NEXT_PUBLIC_API_BASE_URL is set; falls back to mock if missing.
export async function fetchSessions(): Promise<AdminSessionRow[]> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) return fetchSessionsMock();

  const res = await fetch(`${API_BASE_URL}/sessions`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to load sessions (${res.status}): ${body || res.statusText}`,
    );
  }

  type ApiSession = {
    id: string;
    title: string | null;
    startsAt: string;
    endsAt: string;
    groupId: string | null;
    tenantId: string;
  };

  const json = (await res.json()) as ApiSession[];

  const mapStatus = (
    startsAt: string,
    endsAt: string,
  ): AdminSessionRow["status"] => {
    const now = Date.now();
    const startMs = new Date(startsAt).getTime();
    const endMs = new Date(endsAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "not_started";
    if (now < startMs) return "not_started";
    if (now >= startMs && now <= endMs) return "in_progress";
    return "completed";
  };

  return json.map((s) => ({
    id: s.id,
    title: s.title ?? "Session",
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    ageGroup: "—", // TODO: enrich with group/age info once API returns it
    room: s.groupId ?? "—", // TODO: map to room/group name when available
    status: mapStatus(s.startsAt, s.endsAt),
    attendanceMarked: 0, // TODO: replace with real attendance summary once available
    attendanceTotal: 0,
    leadStaff: undefined,
    supportStaff: undefined,
  }));
}

// TODO: replace with real API call using tenant-scoped endpoint and auth headers
export async function fetchChildrenMock(): Promise<AdminChildRow[]> {
  return Promise.resolve([
    {
      id: "c1",
      fullName: "Amara Patel",
      preferredName: "Amara",
      ageGroup: "Year 3",
      primaryGroup: "Year 3A",
      hasPhotoConsent: true,
      hasAllergies: true,
      hasAdditionalNeeds: false,
      status: "active",
    },
    {
      id: "c2",
      fullName: "Leo Williams",
      preferredName: null,
      ageGroup: "Year 4",
      primaryGroup: "Year 4B",
      hasPhotoConsent: false,
      hasAllergies: false,
      hasAdditionalNeeds: true,
      status: "active",
    },
    {
      id: "c3",
      fullName: "Sofia Nguyen",
      preferredName: "Sofia",
      ageGroup: "Year 5",
      primaryGroup: "Year 5A",
      hasPhotoConsent: true,
      hasAllergies: false,
      hasAdditionalNeeds: false,
      status: "inactive",
    },
  ]);
}

// TODO: replace mock lookup with real API call; include tenant/org context and auth
export async function fetchChildById(
  id: string,
): Promise<AdminChildRow | null> {
  const all = await fetchChildrenMock();
  return all.find((c) => c.id === id) ?? null;
}

type ApiChild = {
  id: string;
  firstName: string;
  lastName: string;
  photoKey: string | null;
  allergies: string[] | null;
  disabilities: string[] | null;
  groupId: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

const mapApiChildToAdmin = (c: ApiChild): AdminChildRow => ({
  id: c.id,
  fullName: `${c.firstName} ${c.lastName}`.trim(),
  preferredName: null, // TODO: populate when API exposes preferredName
  ageGroup: "—", // TODO: map when API exposes age/room/group name
  primaryGroup: c.groupId ?? "—",
  hasPhotoConsent: false, // TODO: derive from consent flag when available (do not assume photoKey implies consent)
  hasAllergies: Array.isArray(c.allergies) && c.allergies.length > 0,
  hasAdditionalNeeds:
    Array.isArray(c.disabilities) && c.disabilities.length > 0,
  status: "active", // TODO: map from API status/archived flag when available
});

// Uses real API when NEXT_PUBLIC_API_BASE_URL is set; falls back to mock if missing.
export async function fetchChildren(): Promise<AdminChildRow[]> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) return fetchChildrenMock();

  const res = await fetch(`${API_BASE_URL}/children`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch children (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiChild[];
  return json.map(mapApiChildToAdmin);
}

// TODO: replace with real API call; include tenant/org context and auth
export async function fetchParentsMock(): Promise<AdminParentRow[]> {
  return Promise.resolve([
    {
      id: "p1",
      fullName: "Priya Patel",
      email: "priya.patel@example.edu",
      phone: "+44 7700 900001",
      children: [{ id: "c1", name: "Amara Patel" }],
      isPrimaryContact: true,
      status: "active",
    },
    {
      id: "p2",
      fullName: "Daniel Williams",
      email: "daniel.williams@example.edu",
      phone: "+44 7700 900002",
      children: [{ id: "c2", name: "Leo Williams" }],
      isPrimaryContact: true,
      status: "active",
    },
    {
      id: "p3",
      fullName: "Mai Nguyen",
      email: "mai.nguyen@example.edu",
      phone: null,
      children: [{ id: "c3", name: "Sofia Nguyen" }],
      isPrimaryContact: false,
      status: "inactive",
    },
  ]);
}

// TODO: replace mock lookup with real API call; include tenant/org context and auth
export async function fetchParentById(
  id: string,
): Promise<AdminParentRow | null> {
  const all = await fetchParentsMock();
  return all.find((p) => p.id === id) ?? null;
}

type ApiParentSummary = {
  id: string;
  fullName: string;
  email: string | null;
  childrenCount: number;
};

const mapApiParentToAdminParentRow = (
  api: ApiParentSummary,
): AdminParentRow => ({
  id: api.id,
  fullName: api.fullName || "Unknown parent",
  email: api.email ?? "",
  phone: null, // TODO: map phone when backend exposes it
  children: [], // TODO: map child summaries when list endpoint exposes them
  childrenCount: api.childrenCount,
  isPrimaryContact: false, // TODO: map when API exposes primary-contact flag
  status: "active", // TODO: map real status/archival when available
});

// Uses real API when NEXT_PUBLIC_API_BASE_URL is set; falls back to mock if missing.
export async function fetchParents(): Promise<AdminParentRow[]> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) return fetchParentsMock(); // Fallback to mock data when API base URL is not configured.

  const res = await fetch(`${API_BASE_URL}/parents`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch parents: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiParentSummary[];
  return json.map(mapApiParentToAdminParentRow);
}
