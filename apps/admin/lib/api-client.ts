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

export type AdminSessionDetail = AdminSessionRow;

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

export type AdminChildDetail = {
  id: string;
  fullName: string;
  preferredName?: string | null;
  ageGroupLabel?: string | null;
  primaryGroupLabel?: string | null;
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

export type AdminParentDetail = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  children: { id: string; fullName: string }[];
  childrenCount?: number;
  isPrimaryContact: boolean;
  status: "active" | "inactive";
};

export type AdminAnnouncementRow = {
  id: string;
  title: string;
  audienceLabel: string;
  statusLabel: string;
  createdAt: string;
  scheduledAt?: string | null;
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

const mapSessionStatus = (
  startsAt?: string,
  endsAt?: string,
): AdminSessionRow["status"] => {
  if (!startsAt || !endsAt) return "not_started";
  const now = Date.now();
  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "not_started";
  if (now < startMs) return "not_started";
  if (now >= startMs && now <= endMs) return "in_progress";
  return "completed";
};

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

type ApiSessionDetail = {
  id: string;
  title: string | null;
  startsAt: string;
  endsAt: string;
  ageGroup?: string | null;
  room?: string | null;
  groupId?: string | null;
  attendanceMarked?: number | null;
  attendanceTotal?: number | null;
  presentCount?: number | null;
  absentCount?: number | null;
  lateCount?: number | null;
  leadStaff?: string | null;
  supportStaff?: string[] | null;
};

const mapApiSessionDetailToAdmin = (
  s: ApiSessionDetail,
): AdminSessionDetail => ({
  id: s.id,
  title: s.title ?? "Session",
  startsAt: s.startsAt,
  endsAt: s.endsAt,
  ageGroup: s.ageGroup ?? "—", // TODO: map to age group label once API exposes it
  room: s.room ?? s.groupId ?? "—", // TODO: map to room/group name when available
  status: mapSessionStatus(s.startsAt, s.endsAt),
  attendanceMarked:
    s.attendanceMarked ??
    (typeof s.presentCount === "number" ? s.presentCount : 0),
  attendanceTotal:
    s.attendanceTotal ??
    (typeof s.attendanceMarked === "number" ? s.attendanceMarked : 0),
  presentCount: typeof s.presentCount === "number" ? s.presentCount : undefined,
  absentCount: typeof s.absentCount === "number" ? s.absentCount : undefined,
  lateCount: typeof s.lateCount === "number" ? s.lateCount : undefined,
  leadStaff: s.leadStaff ?? undefined,
  supportStaff: s.supportStaff ?? undefined,
});

export async function fetchSessionById(
  id: string,
): Promise<AdminSessionDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    const all = await fetchSessionsMock();
    return all.find((s) => s.id === id) ?? null;
  }

  const res = await fetch(`${API_BASE_URL}/sessions/${id}`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch session: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiSessionDetail;
  return mapApiSessionDetailToAdmin(json);
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

  return json.map((s) => ({
    id: s.id,
    title: s.title ?? "Session",
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    ageGroup: "—", // TODO: enrich with group/age info once API returns it
    room: s.groupId ?? "—", // TODO: map to room/group name when available
    status: mapSessionStatus(s.startsAt, s.endsAt),
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

type ApiChildDetail = ApiChild & {
  preferredName?: string | null;
  ageGroup?: string | null;
  ageGroupLabel?: string | null;
  primaryGroup?: string | null;
  primaryGroupLabel?: string | null;
  hasPhotoConsent?: boolean | null;
  status?: string | null;
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

const mapApiChildDetailToAdmin = (c: ApiChildDetail): AdminChildDetail => ({
  id: c.id,
  fullName: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Child",
  preferredName: c.preferredName ?? null,
  ageGroupLabel: c.ageGroupLabel ?? c.ageGroup ?? null,
  primaryGroupLabel: c.primaryGroupLabel ?? c.primaryGroup ?? c.groupId ?? null,
  hasPhotoConsent: Boolean(c.hasPhotoConsent),
  hasAllergies: Array.isArray(c.allergies) && c.allergies.length > 0,
  hasAdditionalNeeds:
    Array.isArray(c.disabilities) && c.disabilities.length > 0,
  status: c.status === "inactive" ? "inactive" : "active",
});

export async function fetchChildById(
  id: string,
): Promise<AdminChildDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    const all = await fetchChildrenMock();
    const match = all.find((c) => c.id === id);
    return match
      ? {
          id: match.id,
          fullName: match.fullName,
          preferredName: match.preferredName ?? null,
          ageGroupLabel: match.ageGroup ?? null,
          primaryGroupLabel: match.primaryGroup ?? null,
          hasPhotoConsent: match.hasPhotoConsent,
          hasAllergies: match.hasAllergies,
          hasAdditionalNeeds: match.hasAdditionalNeeds,
          status: match.status,
        }
      : null;
  }

  const res = await fetch(`${API_BASE_URL}/children/${id}`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch child: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiChildDetail;
  return mapApiChildDetailToAdmin(json);
}

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

type ApiParentSummary = {
  id: string;
  fullName: string;
  email: string | null;
  childrenCount: number;
};

type ApiParentDetail = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  children?: { id: string; fullName?: string | null; name?: string | null }[];
  isPrimaryContact?: boolean | null;
  status?: string | null;
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

const mapApiParentDetailToAdmin = (
  api: ApiParentDetail,
): AdminParentDetail => ({
  id: api.id,
  fullName: api.fullName || "Unknown parent",
  email: api.email ?? "",
  phone: api.phone ?? null,
  children:
    api.children?.map((child) => ({
      id: child.id,
      fullName: child.fullName ?? child.name ?? "Child",
    })) ?? [],
  childrenCount: api.children?.length ?? undefined,
  isPrimaryContact: Boolean(api.isPrimaryContact),
  status: api.status === "inactive" ? "inactive" : "active",
});

export async function fetchParentById(
  id: string,
): Promise<AdminParentDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    const all = await fetchParentsMock();
    const match = all.find((p) => p.id === id);
    return match
      ? {
          id: match.id,
          fullName: match.fullName,
          email: match.email,
          phone: match.phone ?? null,
          children:
            match.children?.map((child) => ({
              id: child.id,
              fullName: child.name ?? "Child",
            })) ?? [],
          childrenCount: match.childrenCount ?? match.children.length,
          isPrimaryContact: match.isPrimaryContact,
          status: match.status,
        }
      : null;
  }

  const res = await fetch(`${API_BASE_URL}/parents/${id}`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }
    throw new Error(`Failed to fetch parent: ${res.status} ${body}`);
  }

  const json = (await res.json()) as ApiParentDetail;
  return mapApiParentDetailToAdmin(json);
}

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

type ApiAnnouncement = {
  id: string;
  title: string;
  status: string;
  audience?: string | null;
  createdAt: string;
  scheduledAt?: string | null;
};

const statusLabelMap: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
};

const audienceLabelMap: Record<string, string> = {
  parents: "Parents",
  staff: "Staff",
  parents_staff: "Parents & staff",
};

const mapApiAnnouncementToAdminRow = (
  api: ApiAnnouncement,
): AdminAnnouncementRow => ({
  id: api.id,
  title: api.title,
  audienceLabel:
    (api.audience && audienceLabelMap[api.audience]) || api.audience || "—",
  statusLabel: statusLabelMap[api.status] ?? api.status ?? "Unknown",
  createdAt: api.createdAt,
  scheduledAt: api.scheduledAt ?? null,
});

export async function fetchAnnouncements(): Promise<AdminAnnouncementRow[]> {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return [
      {
        id: "a1",
        title: "Staff inset day reminder",
        audienceLabel: "Staff",
        statusLabel: "Scheduled",
        createdAt: new Date().toISOString(),
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      },
      {
        id: "a2",
        title: "Parents evening signup",
        audienceLabel: "Parents",
        statusLabel: "Draft",
        createdAt: new Date().toISOString(),
        scheduledAt: null,
      },
    ];
  }

  const res = await fetch(`${API_BASE_URL}/announcements`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch announcements: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiAnnouncement[];
  return json.map(mapApiAnnouncementToAdminRow);
}

export async function fetchRecentAnnouncements(
  limit = 4,
): Promise<AdminAnnouncementRow[]> {
  const all = await fetchAnnouncements();
  return all
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}
