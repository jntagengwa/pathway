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

export type AdminAssignmentRow = {
  id: string;
  sessionId: string;
  staffId: string;
  staffName: string;
  roleLabel: "Lead" | "Support" | string;
  status: "pending" | "confirmed" | "declined";
  sessionTitle?: string;
  startsAt?: string;
  endsAt?: string;
};

export type AdminAssignmentInput = {
  sessionId: string;
  staffId: string;
  role: string;
  status?: "pending" | "confirmed";
};

export type AdminRotaDay = {
  date: string; // YYYY-MM-DD
  assignments: AdminAssignmentRow[];
};

export type AdminSessionDetail = AdminSessionRow & {
  assignments?: AdminAssignmentRow[];
};

// SESSION FORMS (CreateSessionDto / UpdateSessionDto subset)
export type AdminSessionFormValues = {
  title: string;
  startsAt: string;
  endsAt: string;
  groupId?: string;
  tenantId?: string;
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

export type AdminAnnouncementDetail = {
  id: string;
  title: string;
  body: string | null;
  audienceLabel: string | null;
  status: "draft" | "scheduled" | "sent" | "archived" | "unknown" | string;
  createdAt: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  channels?: string[] | null;
  targetsSummary?: string | null;
};

// ANNOUNCEMENTS FORMS (CreateAnnouncementDto / UpdateAnnouncementDto subset)
export type AdminAnnouncementFormValues = {
  title: string;
  body: string;
  audience: "ALL" | "PARENTS" | "STAFF";
  sendMode: "draft" | "now" | "schedule";
  scheduledAt?: string;
  channels?: string[];
  tenantId?: string;
};

export type AdminAttendanceRow = {
  id: string; // sessionId
  sessionId: string;
  title: string;
  date: string;
  timeRangeLabel: string;
  roomLabel: string | null;
  ageGroupLabel: string | null;
  attendanceMarked: number;
  attendanceTotal: number;
  status: "not_started" | "in_progress" | "completed";
};

export type AdminAttendanceDetail = {
  sessionId: string;
  title: string;
  date: string;
  timeRangeLabel: string;
  roomLabel: string | null;
  ageGroupLabel: string | null;
  rows: {
    childId: string;
    childName: string;
    status: "present" | "absent" | "late" | "unknown";
  }[];
  summary: {
    present: number;
    absent: number;
    late: number;
    unknown: number;
  };
  status: "not_started" | "in_progress" | "completed";
};

export type AdminConcernRow = {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
  status: "open" | "in_review" | "closed" | "other";
  category?: string | null;
  childLabel: string;
  reportedByLabel?: string | null;
};

export type AdminNotesSummary = {
  totalNotes: number;
  visibleToParents: number;
  staffOnly: number;
};

export type AdminStaffRow = {
  id: string;
  fullName: string;
  email: string | null;
  rolesLabel: string;
  status: "active" | "inactive" | "unknown";
};

export type AdminStaffDetail = {
  id: string;
  fullName: string;
  email: string | null;
  roles: string[];
  primaryRoleLabel: string | null;
  status: "active" | "inactive" | "unknown";
  groups?: { id: string; name: string }[];
  sessionsCount?: number | null;
};

export type AdminBillingOverview = {
  orgId: string;
  subscriptionStatus:
    | "ACTIVE"
    | "TRIALING"
    | "CANCELED"
    | "PAST_DUE"
    | "NONE"
    | string;
  planCode?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  av30Cap?: number | null;
  currentAv30?: number | null;
  storageGbCap?: number | null;
  storageGbUsage?: number | null;
  smsMessagesCap?: number | null;
  smsMonthUsage?: number | null;
  leaderSeatsIncluded?: number | null;
  maxSites?: number | null;
};

export type AdminOrgOverview = {
  id: string;
  name: string;
  slug: string | null;
  isMultiSite: boolean;
  planTier?: string | null;
  siteCount?: number | null;
};

export type AdminRetentionOverview = {
  attendanceRetentionYears?: number | null;
  safeguardingRetentionYears?: number | null;
  notesRetentionYears?: number | null;
};

export type AdminKpis = {
  totalChildren?: number;
  totalParents?: number;
  openConcerns?: number;
  positiveNotesCount?: number;
  av30Used?: number | null;
  av30Cap?: number | null;
  sessionsToday?: number;
  planTier?: string | null;
};

export type AdminLessonRow = {
  id: string;
  title: string;
  ageGroupLabel: string | null;
  groupLabel: string | null;
  status: "draft" | "published" | "archived" | "unknown";
  updatedAt: string | null;
};

export type AdminLessonDetail = {
  id: string;
  title: string;
  description: string | null;
  ageGroupLabel: string | null;
  groupLabel: string | null;
  status: "draft" | "published" | "archived" | "unknown";
  updatedAt: string | null;
  weekOf?: string | null;
  resources: { id: string; label: string; type?: string | null }[];
};

// LESSON FORMS (CreateLessonDto / UpdateLessonDto subset)
export type AdminLessonFormValues = {
  title: string;
  description?: string;
  weekOf?: string;
  groupId?: string;
  fileKey?: string;
  tenantId?: string;
  resources?: { label: string }[];
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

const getDefaultTenantId = () =>
  process.env.NEXT_PUBLIC_DEV_TENANT_ID ||
  process.env.NEXT_PUBLIC_TENANT_ID ||
  undefined;

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

const buildTimeRangeLabel = (
  startsAt?: string,
  endsAt?: string,
): string | null => {
  if (!startsAt || !endsAt) return null;
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startTime} – ${endTime}`;
};

const isTodayLocal = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

type ApiAssignment = {
  id: string;
  sessionId: string;
  userId: string;
  role?: string | null;
  status?: string | null;
  session?: {
    id: string;
    title?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
  } | null;
  user?: {
    id: string;
    name?: string | null;
  } | null;
};

const normalizeAssignmentStatus = (
  status?: string | null,
): AdminAssignmentRow["status"] => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "declined") return "declined";
  return "pending";
};

const normalizeRoleLabel = (role?: string | null): string => {
  if (!role) return "Support";
  const upper = role.toUpperCase();
  if (upper === "LEAD") return "Lead";
  if (upper === "SUPPORT") return "Support";
  const words = role
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return words.join(" ") || role;
};

export const mapApiAssignmentToAdminRow = (
  assignment: ApiAssignment,
  opts?: {
    sessionLookup?: Record<
      string,
      {
        title?: string | null;
        startsAt?: string | null;
        endsAt?: string | null;
      }
    >;
    userLookup?: Record<string, { name?: string | null }>;
  },
): AdminAssignmentRow => {
  const sessionMeta =
    opts?.sessionLookup?.[assignment.sessionId] ??
    assignment.session ??
    undefined;
  const userMeta =
    opts?.userLookup?.[assignment.userId] ?? assignment.user ?? undefined;

  const startsAt = sessionMeta?.startsAt ?? undefined;
  const endsAt = sessionMeta?.endsAt ?? undefined;
  const staffId = assignment.userId ?? "unknown";

  return {
    id: assignment.id,
    sessionId: assignment.sessionId,
    staffId,
    staffName:
      (userMeta?.name ?? "").trim() ||
      (staffId !== "unknown" ? `Staff ${staffId.slice(0, 4)}…` : "Staff"),
    roleLabel: normalizeRoleLabel(assignment.role),
    status: normalizeAssignmentStatus(assignment.status),
    sessionTitle: sessionMeta?.title ?? undefined,
    startsAt,
    endsAt,
  };
};

export const mapApiAssignmentsToRotaDays = (
  assignments: AdminAssignmentRow[],
): AdminRotaDay[] => {
  const grouped = new Map<string, AdminAssignmentRow[]>();

  assignments.forEach((assignment) => {
    const dateKey = (() => {
      if (!assignment.startsAt) return "unknown";
      const parsed = new Date(assignment.startsAt);
      if (Number.isNaN(parsed.getTime())) return "unknown";
      return parsed.toISOString().slice(0, 10);
    })();

    const existing = grouped.get(dateKey) ?? [];
    existing.push(assignment);
    grouped.set(dateKey, existing);
  });

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;
    return a.localeCompare(b);
  });

  return sorted.map(([date, dayAssignments]) => ({
    date,
    assignments: [...dayAssignments].sort((a, b) => {
      const aStart = a.startsAt ?? "";
      const bStart = b.startsAt ?? "";
      return aStart.localeCompare(bStart);
    }),
  }));
};

const safeChildLabel = (
  childId?: string | null,
  child?: { firstName?: string | null; lastName?: string | null } | null,
): string => {
  // SAFEGUARDING: do NOT show full child names here. Initials only when available.
  const first = (child?.firstName ?? "").trim();
  const lastInitial = (child?.lastName ?? "").trim().charAt(0);
  if (first) {
    return lastInitial ? `${first} ${lastInitial}.` : first;
  }
  if (childId) {
    return `Child ${childId.slice(0, 4)}…`;
  }
  return "Child record";
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
  ageGroupLabel?: string | null;
  room?: string | null;
  roomName?: string | null;
  groupId?: string | null;
  groupLabel?: string | null;
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
  ageGroup: s.ageGroupLabel ?? s.ageGroup ?? "—",
  room: s.roomName ?? s.room ?? s.groupLabel ?? s.groupId ?? "—",
  status: mapSessionStatus(s.startsAt, s.endsAt),
  attendanceMarked:
    s.attendanceMarked ??
    (typeof s.presentCount === "number" ? s.presentCount : 0) +
      (typeof s.absentCount === "number" ? s.absentCount : 0) +
      (typeof s.lateCount === "number" ? s.lateCount : 0),
  attendanceTotal:
    s.attendanceTotal ??
    (typeof s.presentCount === "number" ? s.presentCount : 0) +
      (typeof s.absentCount === "number" ? s.absentCount : 0) +
      (typeof s.lateCount === "number" ? s.lateCount : 0),
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
    const session = all.find((s) => s.id === id);
    if (!session) return null;
    const sessionLookup = {
      [session.id]: {
        title: session.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
      },
    };
    const assignments = await fetchAssignmentsForOrg({
      sessionId: id,
      sessionLookup,
    });
    return { ...session, assignments };
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
  const session = mapApiSessionDetailToAdmin(json);

  try {
    const sessionLookup = {
      [session.id]: {
        title: session.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
      },
    };
    const assignments = await fetchAssignmentsForOrg({
      sessionId: session.id,
      sessionLookup,
    });
    return { ...session, assignments };
  } catch (err) {
    console.warn("Failed to load assignments for session detail", err);
    return session;
  }
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
    groupLabel?: string | null;
    ageGroup?: string | null;
    ageGroupLabel?: string | null;
    room?: string | null;
    roomName?: string | null;
    attendanceMarked?: number | null;
    attendanceTotal?: number | null;
    presentCount?: number | null;
    absentCount?: number | null;
    lateCount?: number | null;
    tenantId: string;
  };

  const json = (await res.json()) as ApiSession[];

  return json.map((s) => ({
    id: s.id,
    title: s.title ?? "Session",
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    ageGroup: s.ageGroupLabel ?? s.ageGroup ?? "—",
    room: s.roomName ?? s.room ?? s.groupLabel ?? s.groupId ?? "—",
    status: mapSessionStatus(s.startsAt, s.endsAt),
    attendanceMarked:
      s.attendanceMarked ??
      (typeof s.presentCount === "number" ? s.presentCount : 0) +
        (typeof s.absentCount === "number" ? s.absentCount : 0) +
        (typeof s.lateCount === "number" ? s.lateCount : 0),
    attendanceTotal:
      s.attendanceTotal ??
      (typeof s.presentCount === "number" ? s.presentCount : 0) +
        (typeof s.absentCount === "number" ? s.absentCount : 0) +
        (typeof s.lateCount === "number" ? s.lateCount : 0), // TODO: BLOCKED – awaiting attendance totals from API.
    leadStaff: undefined,
    supportStaff: undefined,
  }));
}

// CreateSessionDto fields: tenantId (server will enforce), groupId?, startsAt, endsAt, title?
export async function createSession(
  input: AdminSessionFormValues,
): Promise<AdminSessionDetail> {
  const payload = {
    tenantId: input.tenantId ?? getDefaultTenantId(),
    groupId: input.groupId || undefined,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    title: input.title?.trim() || undefined,
  };

  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to create session (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiSessionDetail;
  return mapApiSessionDetailToAdmin(json);
}

// UpdateSessionDto fields: tenantId?, groupId?, startsAt?, endsAt?, title?
export async function updateSession(
  id: string,
  input: Partial<AdminSessionFormValues>,
): Promise<AdminSessionDetail> {
  const payload = {
    ...(input.title ? { title: input.title.trim() } : {}),
    ...(input.startsAt ? { startsAt: input.startsAt } : {}),
    ...(input.endsAt ? { endsAt: input.endsAt } : {}),
    ...(input.groupId ? { groupId: input.groupId } : {}),
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/sessions/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to update session (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiSessionDetail;
  return mapApiSessionDetailToAdmin(json);
}

// ROTA: assignments are staff + session metadata only.
// Do not expose safeguarding content or internal provider payloads.
export async function fetchAssignmentsForOrg(
  params: {
    dateFrom?: string;
    dateTo?: string;
    sessionId?: string;
    sessionLookup?: Record<
      string,
      {
        title?: string | null;
        startsAt?: string | null;
        endsAt?: string | null;
      }
    >;
    userLookup?: Record<string, { name?: string | null }>;
  } = {},
): Promise<AdminAssignmentRow[]> {
  const {
    dateFrom,
    dateTo,
    sessionId,
    sessionLookup: providedSessionLookup,
    userLookup: providedUserLookup,
  } = params;
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;

  if (useMock) {
    const mockSessions = [
      {
        id: "s1",
        title: "Year 3 Maths",
        startsAt: "2025-01-15T09:00:00Z",
        endsAt: "2025-01-15T09:50:00Z",
      },
      {
        id: "s2",
        title: "Year 5 Science",
        startsAt: "2025-01-16T11:00:00Z",
        endsAt: "2025-01-16T11:50:00Z",
      },
      {
        id: "s3",
        title: "Coding Club",
        startsAt: "2025-01-17T15:30:00Z",
        endsAt: "2025-01-17T16:30:00Z",
      },
    ];
    const sessionLookup =
      providedSessionLookup ??
      mockSessions.reduce<
        Record<string, { title?: string; startsAt?: string; endsAt?: string }>
      >((acc, session) => {
        acc[session.id] = session;
        return acc;
      }, {});
    const userLookup = providedUserLookup ?? {
      u1: { name: "Alex Morgan" },
      u2: { name: "Jamie Lee" },
    };
    const mockAssignments: ApiAssignment[] = [
      {
        id: "a1",
        sessionId: "s1",
        userId: "u1",
        role: "LEAD",
        status: "CONFIRMED",
      },
      {
        id: "a2",
        sessionId: "s1",
        userId: "u2",
        role: "SUPPORT",
        status: "PENDING",
      },
      {
        id: "a3",
        sessionId: "s2",
        userId: "u1",
        role: "SUPPORT",
        status: "CONFIRMED",
      },
    ];
    const filteredBySession = sessionId
      ? mockAssignments.filter((a) => a.sessionId === sessionId)
      : mockAssignments;
    const filteredByDate = filteredBySession.filter((assignment) => {
      if (!dateFrom && !dateTo) return true;
      const session = sessionLookup[assignment.sessionId];
      if (!session?.startsAt) return false;
      const start = session.startsAt.slice(0, 10);
      if (dateFrom && start < dateFrom) return false;
      if (dateTo && start > dateTo) return false;
      return true;
    });
    return filteredByDate.map((a) =>
      mapApiAssignmentToAdminRow(a, { sessionLookup, userLookup }),
    );
  }

  let sessionLookup = providedSessionLookup;
  if ((dateFrom || dateTo) && !sessionLookup) {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set("from", dateFrom);
    if (dateTo) qs.set("to", dateTo);
    const sessionsRes = await fetch(
      `${API_BASE_URL}/sessions${qs.size ? `?${qs.toString()}` : ""}`,
      { headers: buildAuthHeaders(), cache: "no-store" },
    );
    if (sessionsRes.ok) {
      type ApiSessionForLookup = {
        id: string;
        title?: string | null;
        startsAt?: string | null;
        endsAt?: string | null;
      };
      const sessionJson = (await sessionsRes.json()) as ApiSessionForLookup[];
      sessionLookup = sessionJson.reduce<
        Record<
          string,
          {
            title?: string | null;
            startsAt?: string | null;
            endsAt?: string | null;
          }
        >
      >((acc, s) => {
        acc[s.id] = {
          title: s.title ?? undefined,
          startsAt: s.startsAt ?? undefined,
          endsAt: s.endsAt ?? undefined,
        };
        return acc;
      }, {});
    } else {
      const body = await sessionsRes.text().catch(() => "");
      console.warn(
        "Failed to prefetch sessions for rota window",
        sessionsRes.status,
        body,
      );
    }
  }

  let userLookup = providedUserLookup;
  if (!userLookup) {
    try {
      const staff = await fetchStaff();
      userLookup = staff.reduce<Record<string, { name?: string | null }>>(
        (acc, person) => {
          acc[person.id] = { name: person.fullName };
          return acc;
        },
        {},
      );
    } catch (err) {
      console.warn("Failed to fetch staff lookup for assignments", err);
    }
  }

  const assignmentQuery = new URLSearchParams();
  if (sessionId) assignmentQuery.set("sessionId", sessionId);

  const res = await fetch(
    `${API_BASE_URL}/assignments${
      assignmentQuery.size ? `?${assignmentQuery.toString()}` : ""
    }`,
    {
      headers: buildAuthHeaders(),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to load assignments (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiAssignment[];
  const filtered = json.filter((assignment) => {
    if (!dateFrom && !dateTo) return true;
    const session = sessionLookup?.[assignment.sessionId];
    if (!session?.startsAt) return true;
    const start = session.startsAt.slice(0, 10);
    if (dateFrom && start < dateFrom) return false;
    if (dateTo && start > dateTo) return false;
    return true;
  });

  return filtered.map((assignment) =>
    mapApiAssignmentToAdminRow(assignment, { sessionLookup, userLookup }),
  );
}

export async function createAssignment(
  input: AdminAssignmentInput,
  opts?: {
    sessionLookup?: Record<
      string,
      {
        title?: string | null;
        startsAt?: string | null;
        endsAt?: string | null;
      }
    >;
    userLookup?: Record<string, { name?: string | null }>;
  },
): Promise<AdminAssignmentRow> {
  const payload = {
    sessionId: input.sessionId,
    userId: input.staffId,
    role: input.role,
    status:
      input.status === "confirmed"
        ? "CONFIRMED"
        : input.status === "pending"
          ? "PENDING"
          : undefined,
  };

  const res = await fetch(`${API_BASE_URL}/assignments`, {
    method: "POST",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to create assignment (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiAssignment;
  return mapApiAssignmentToAdminRow(json, {
    sessionLookup: opts?.sessionLookup,
    userLookup: opts?.userLookup,
  });
}

export async function updateAssignment(
  id: string,
  input: Partial<AdminAssignmentInput> & { status?: string },
  opts?: {
    sessionLookup?: Record<
      string,
      {
        title?: string | null;
        startsAt?: string | null;
        endsAt?: string | null;
      }
    >;
    userLookup?: Record<string, { name?: string | null }>;
  },
): Promise<AdminAssignmentRow> {
  const rawStatus = input.status as string | undefined;
  const normalizedStatus = rawStatus
    ? rawStatus === "confirmed"
      ? "CONFIRMED"
      : rawStatus === "pending"
        ? "PENDING"
        : rawStatus === "declined"
          ? "DECLINED"
          : rawStatus.toUpperCase()
    : undefined;

  const payload = {
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    ...(input.staffId ? { userId: input.staffId } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to update assignment (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiAssignment;
  return mapApiAssignmentToAdminRow(json, {
    sessionLookup: opts?.sessionLookup,
    userLookup: opts?.userLookup,
  });
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/assignments/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to delete assignment (${res.status}): ${body || res.statusText}`,
    );
  }
}

export async function fetchAssignmentsForCurrentStaff(params: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<AdminAssignmentRow[]> {
  // TODO: once auth exposes staff userId, filter assignments to current staff only and reuse in mobile app.
  return fetchAssignmentsForOrg(params);
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
  additionalNeeds?: string[] | null;
  groupId: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  preferredName?: string | null;
  ageGroup?: string | null;
  ageGroupLabel?: string | null;
  primaryGroup?: string | null;
  primaryGroupLabel?: string | null;
  hasPhotoConsent?: boolean | null;
  status?: string | null;
};

type ApiChildDetail = ApiChild & {};

const mapApiChildToAdmin = (c: ApiChild): AdminChildRow => ({
  id: c.id,
  fullName: `${c.firstName} ${c.lastName}`.trim(),
  preferredName: c.preferredName ?? null,
  ageGroup: c.ageGroupLabel ?? c.ageGroup ?? "—",
  primaryGroup: c.primaryGroupLabel ?? c.primaryGroup ?? c.groupId ?? "—",
  hasPhotoConsent: Boolean(c.hasPhotoConsent),
  hasAllergies: Array.isArray(c.allergies) && c.allergies.length > 0,
  hasAdditionalNeeds:
    (Array.isArray(c.disabilities) && c.disabilities.length > 0) ||
    (Array.isArray(c.additionalNeeds) && c.additionalNeeds.length > 0),
  status: c.status === "inactive" ? "inactive" : "active", // TODO: BLOCKED – needs child.status from API to reflect archived/deactivated children.
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
    (Array.isArray(c.disabilities) && c.disabilities.length > 0) ||
    (Array.isArray(c.additionalNeeds) && c.additionalNeeds.length > 0),
  status: c.status === "inactive" ? "inactive" : "active", // TODO: BLOCKED – needs child.status from API to reflect archived/deactivated children.
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
  status?: string | null;
  isPrimaryContact?: boolean | null;
};

type ApiParentDetail = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  children?: {
    id: string;
    fullName?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }[];
  isPrimaryContact?: boolean | null;
  status?: string | null;
};

const mapApiParentToAdminParentRow = (
  api: ApiParentSummary,
): AdminParentRow => ({
  id: api.id,
  fullName: api.fullName || "Unknown parent",
  email: api.email ?? "",
  phone: null, // TODO: BLOCKED – requires phone field from parents list API.
  children: [], // TODO: BLOCKED – list endpoint does not include child summaries yet.
  childrenCount: api.childrenCount,
  isPrimaryContact: Boolean(api.isPrimaryContact), // TODO: BLOCKED – needs primaryContact flag from API list.
  status: api.status === "inactive" ? "inactive" : "active", // TODO: BLOCKED – needs parent.status to reflect archived/deactivated parents.
});

const mapApiParentDetailToAdmin = (
  api: ApiParentDetail,
): AdminParentDetail => ({
  id: api.id,
  fullName: api.fullName || "Unknown parent",
  email: api.email ?? "",
  phone: api.phone ?? null, // TODO: BLOCKED – requires phone from API.
  children:
    api.children?.map((child) => ({
      id: child.id,
      fullName:
        child.fullName ??
        child.name ??
        (`${child.firstName ?? ""} ${child.lastName ?? ""}`.trim() || "Child"),
    })) ?? [],
  childrenCount: api.children?.length ?? undefined,
  isPrimaryContact: Boolean(api.isPrimaryContact), // TODO: BLOCKED – needs primaryContact flag from API.
  status: api.status === "inactive" ? "inactive" : "active", // TODO: BLOCKED – needs parent.status to reflect archived/deactivated parents.
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
  archived: "Archived",
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

const mapApiAnnouncementToAdminDetail = (
  api: ApiAnnouncement,
): AdminAnnouncementDetail => ({
  id: api.id,
  title: api.title,
  body: (api as { body?: string | null }).body ?? null,
  audienceLabel:
    (api.audience && audienceLabelMap[api.audience]) || api.audience || null,
  status:
    api.status === "draft" ||
    api.status === "scheduled" ||
    api.status === "sent" ||
    api.status === "archived"
      ? api.status
      : (api.status ?? "unknown"),
  createdAt: api.createdAt ?? null,
  scheduledAt: api.scheduledAt ?? null,
  publishedAt: (api as { publishedAt?: string | null }).publishedAt ?? null,
  channels:
    ((api as { channels?: string[] | null }).channels ??
    (api as { channel?: string | null }).channel)
      ? [(api as { channel?: string | null }).channel as string]
      : null,
  targetsSummary:
    (api as { targetsSummary?: string | null }).targetsSummary ?? null,
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

// NOTICES: detail view is read-only; do not surface provider payloads or internal delivery logs here.
export async function fetchAnnouncementById(
  id: string,
): Promise<AdminAnnouncementDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    const mock = await fetchAnnouncements();
    const row = mock.find((a) => a.id === id);
    return row
      ? {
          id: row.id,
          title: row.title,
          body: "Mock announcement body.",
          audienceLabel: row.audienceLabel,
          status:
            row.statusLabel.toLowerCase() as AdminAnnouncementDetail["status"],
          createdAt: row.createdAt,
          scheduledAt: row.scheduledAt ?? null,
          publishedAt: row.scheduledAt ?? null,
          channels: ["in-app"],
          targetsSummary: row.audienceLabel,
        }
      : null;
  }

  const res = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch announcement: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiAnnouncement;
  return mapApiAnnouncementToAdminDetail(json);
}

// CreateAnnouncementDto fields: tenantId, title, body, audience, publishedAt?
export async function createAnnouncement(
  input: AdminAnnouncementFormValues,
): Promise<AdminAnnouncementDetail> {
  const publishedAt =
    input.sendMode === "now"
      ? new Date().toISOString()
      : input.sendMode === "schedule"
        ? input.scheduledAt
        : undefined;

  const payload = {
    tenantId: input.tenantId ?? getDefaultTenantId(),
    title: input.title?.trim(),
    body: input.body?.trim(),
    audience: input.audience,
    ...(publishedAt ? { publishedAt } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/announcements`, {
    method: "POST",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to create announcement (${res.status}): ${
        body || res.statusText
      }`,
    );
  }

  const json = (await res.json()) as ApiAnnouncement;
  return mapApiAnnouncementToAdminDetail(json);
}

// UpdateAnnouncementDto fields: title?, body?, audience?, publishedAt?
export async function updateAnnouncement(
  id: string,
  input: Partial<AdminAnnouncementFormValues>,
): Promise<AdminAnnouncementDetail> {
  const publishedAt =
    input.sendMode === "now"
      ? new Date().toISOString()
      : input.sendMode === "schedule"
        ? input.scheduledAt
        : input.sendMode === "draft"
          ? null
          : undefined;

  const payload = {
    ...(input.title ? { title: input.title.trim() } : {}),
    ...(input.body ? { body: input.body.trim() } : {}),
    ...(input.audience ? { audience: input.audience } : {}),
    ...(typeof publishedAt !== "undefined" ? { publishedAt } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to update announcement (${res.status}): ${
        body || res.statusText
      }`,
    );
  }

  const json = (await res.json()) as ApiAnnouncement;
  return mapApiAnnouncementToAdminDetail(json);
}

// REPORTS: this helper must only aggregate counts/ratios from existing endpoints; no raw safeguarding text or provider payloads.
export async function fetchAdminKpis(): Promise<AdminKpis> {
  const results = await Promise.allSettled([
    fetchChildren(),
    fetchParents(),
    fetchOpenConcerns(),
    fetchNotesSummary(),
    fetchBillingOverview(),
    fetchSessions(),
  ]);

  const children =
    results[0].status === "fulfilled" ? (results[0].value ?? []) : undefined;
  const parents =
    results[1].status === "fulfilled" ? (results[1].value ?? []) : undefined;
  const concerns =
    results[2].status === "fulfilled" ? (results[2].value ?? []) : undefined;
  const notesSummary =
    results[3].status === "fulfilled" ? (results[3].value ?? null) : undefined;
  const billing =
    results[4].status === "fulfilled" ? (results[4].value ?? null) : undefined;
  const sessions =
    results[5].status === "fulfilled" ? (results[5].value ?? []) : undefined;

  const kpis: AdminKpis = {
    totalChildren: Array.isArray(children) ? children.length : undefined,
    totalParents: Array.isArray(parents) ? parents.length : undefined,
    openConcerns: Array.isArray(concerns) ? concerns.length : undefined,
    positiveNotesCount: notesSummary ? notesSummary.totalNotes : undefined,
    av30Used: billing ? (billing.currentAv30 ?? null) : null,
    av30Cap: billing ? (billing.av30Cap ?? null) : null,
    sessionsToday: Array.isArray(sessions)
      ? sessions.filter(
          (s) => isTodayLocal(s.startsAt) || isTodayLocal(s.endsAt),
        ).length
      : undefined,
    planTier: billing?.planCode ?? null,
  };

  const allRejected = results.every((r) => r.status === "rejected");
  if (allRejected) {
    throw new Error("Failed to load reports data");
  }

  return kpis;
}

type ApiLesson = {
  id: string;
  title: string;
  description?: string | null;
  groupId?: string | null;
  groupLabel?: string | null;
  ageGroupLabel?: string | null;
  tenantId?: string;
  weekOf?: string | null;
  fileKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status?: string | null;
};

const mapLessonStatus = (status?: string | null): AdminLessonRow["status"] => {
  if (status === "draft" || status === "published" || status === "archived") {
    return status;
  }
  return "unknown";
};

const resourceLabelFromKey = (key?: string | null) => {
  if (!key) return "Resource";
  const parts = key.split("/");
  const last = parts.pop();
  return last || key;
};

const mapApiLessonToAdminRow = (api: ApiLesson): AdminLessonRow => ({
  id: api.id,
  title: api.title,
  ageGroupLabel: api.ageGroupLabel ?? api.weekOf ?? null, // TODO: map age group when backend exposes a dedicated label.
  groupLabel: api.groupLabel ?? api.groupId ?? null, // TODO: map group/class name when API exposes it.
  status: mapLessonStatus(api.status),
  updatedAt: api.updatedAt ?? api.createdAt ?? null,
});

const mapApiLessonToAdminDetail = (api: ApiLesson): AdminLessonDetail => ({
  id: api.id,
  title: api.title,
  description: api.description ?? null,
  ageGroupLabel: api.ageGroupLabel ?? api.weekOf ?? null, // TODO: map age group when backend exposes a dedicated label.
  groupLabel: api.groupLabel ?? api.groupId ?? null, // TODO: map group/class name when API exposes it.
  status: mapLessonStatus(api.status),
  updatedAt: api.updatedAt ?? api.createdAt ?? null,
  weekOf: api.weekOf ?? null,
  resources: api.fileKey
    ? [
        {
          id: api.fileKey,
          label: resourceLabelFromKey(api.fileKey),
          type: null,
        },
      ]
    : [], // NOTE: resources are label-only here; do not expose storage keys or URLs.
});

// LESSONS: content/curriculum only – no safeguarding notes or secrets. Do not expose raw S3 URLs or provider payloads; show safe labels only.
export async function fetchLessons(): Promise<AdminLessonRow[]> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return [
      {
        id: "l1",
        title: "Year 3 Maths – Fractions",
        ageGroupLabel: "Year 3",
        groupLabel: "3A",
        status: "published",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "l2",
        title: "Year 4 Science – Habitats",
        ageGroupLabel: "Year 4",
        groupLabel: "4B",
        status: "draft",
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const res = await fetch(`${API_BASE_URL}/lessons`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch lessons: ${res.status} ${body}`);
  }

  const json = (await res.json()) as ApiLesson[];
  return json.map(mapApiLessonToAdminRow);
}

export async function fetchLessonById(
  lessonId: string,
): Promise<AdminLessonDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return {
      id: lessonId,
      title: "Mock lesson",
      description: "This is a mock lesson description.",
      ageGroupLabel: "Year 3",
      groupLabel: "3A",
      status: "draft",
      updatedAt: new Date().toISOString(),
      resources: [
        { id: "res1", label: "Mock worksheet.pdf", type: "pdf" },
        { id: "res2", label: "Slides.pptx", type: "ppt" },
      ],
    };
  }

  const res = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch lesson: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiLesson;
  return mapApiLessonToAdminDetail(json);
}

// CreateLessonDto fields: tenantId, title, description?, fileKey?, groupId?, weekOf (date)
export async function createLesson(
  input: AdminLessonFormValues,
): Promise<AdminLessonDetail> {
  const payload = {
    tenantId: input.tenantId ?? getDefaultTenantId(),
    title: input.title?.trim(),
    description: input.description?.trim() || undefined,
    fileKey: input.fileKey || undefined,
    groupId: input.groupId || undefined,
    weekOf: input.weekOf,
  };

  const res = await fetch(`${API_BASE_URL}/lessons`, {
    method: "POST",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to create lesson (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiLesson;
  return mapApiLessonToAdminDetail(json);
}

// UpdateLessonDto fields: title?, description?, fileKey?, groupId?, weekOf?
export async function updateLesson(
  id: string,
  input: Partial<AdminLessonFormValues>,
): Promise<AdminLessonDetail> {
  const payload = {
    ...(input.title ? { title: input.title.trim() } : {}),
    ...(input.description ? { description: input.description.trim() } : {}),
    ...(input.fileKey ? { fileKey: input.fileKey } : {}),
    ...(input.groupId ? { groupId: input.groupId } : {}),
    ...(input.weekOf ? { weekOf: input.weekOf } : {}),
  };

  const res = await fetch(`${API_BASE_URL}/lessons/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(),
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to update lesson (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiLesson;
  return mapApiLessonToAdminDetail(json);
}

type ApiAttendanceRow = {
  id: string;
  childId: string;
  groupId: string | null;
  present: boolean | null;
  timestamp: string;
  sessionId: string | null;
};

const mapAttendanceStatus = (
  present: boolean | null,
): "present" | "absent" | "late" | "unknown" => {
  if (present === true) return "present";
  if (present === false) return "absent";
  return "unknown";
};

export async function fetchAttendanceSummariesForToday(): Promise<
  AdminAttendanceRow[]
> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return [
      {
        id: "s1",
        sessionId: "s1",
        title: "Year 3 Maths",
        date: new Date().toISOString(),
        timeRangeLabel: "09:00 – 09:50",
        roomLabel: "Room 12",
        ageGroupLabel: "Year 3",
        attendanceMarked: 18,
        attendanceTotal: 24,
        status: "in_progress",
      },
    ];
  }

  const [attendanceRes, sessions] = await Promise.all([
    fetch(`${API_BASE_URL}/attendance`, {
      headers: buildAuthHeaders(),
      cache: "no-store",
    }),
    fetchSessions(),
  ]);

  if (!attendanceRes.ok) {
    const body = await attendanceRes.text().catch(() => "");
    throw new Error(
      `Failed to fetch attendance: ${attendanceRes.status} ${body}`,
    );
  }

  const attendance = (await attendanceRes.json()) as ApiAttendanceRow[];
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const grouped = attendance.reduce<Record<string, ApiAttendanceRow[]>>(
    (acc, row) => {
      if (!row.sessionId) return acc;
      acc[row.sessionId] = acc[row.sessionId] || [];
      acc[row.sessionId].push(row);
      return acc;
    },
    {},
  );

  const rows: AdminAttendanceRow[] = Object.entries(grouped)
    .map(([sessionId, rowsForSession]) => {
      const session = sessionMap.get(sessionId);
      const dateSource =
        session?.startsAt ??
        rowsForSession[0]?.timestamp ??
        new Date().toISOString();
      const timeRangeLabel =
        buildTimeRangeLabel(session?.startsAt, session?.endsAt) ?? "Time TBC";
      const attendanceMarked = rowsForSession.filter(
        (r) => typeof r.present === "boolean",
      ).length;
      const attendanceTotal = rowsForSession.length;

      return {
        id: sessionId,
        sessionId,
        title: session?.title ?? "Session",
        date: dateSource,
        timeRangeLabel,
        roomLabel: session?.room ?? null,
        ageGroupLabel: session?.ageGroup ?? null,
        attendanceMarked,
        attendanceTotal,
        status:
          session?.status ??
          mapSessionStatus(session?.startsAt, session?.endsAt) ??
          "not_started",
      };
    })
    .filter(
      (row) =>
        isTodayLocal(row.date) ||
        isTodayLocal(sessionMap.get(row.sessionId)?.startsAt) ||
        isTodayLocal(sessionMap.get(row.sessionId)?.endsAt),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return rows;
}

export async function fetchAttendanceDetailBySessionId(
  sessionId: string,
): Promise<AdminAttendanceDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return {
      sessionId,
      title: "Year 3 Maths",
      date: new Date().toISOString(),
      timeRangeLabel: "09:00 – 09:50",
      roomLabel: "Room 12",
      ageGroupLabel: "Year 3",
      rows: [
        { childId: "c1", childName: "Amara Patel", status: "present" },
        { childId: "c2", childName: "Leo Williams", status: "absent" },
      ],
      summary: { present: 1, absent: 1, late: 0, unknown: 0 },
      status: "in_progress",
    };
  }

  const [attendanceRes, session] = await Promise.all([
    fetch(`${API_BASE_URL}/attendance`, {
      headers: buildAuthHeaders(),
      cache: "no-store",
    }),
    fetchSessionById(sessionId),
  ]);

  if (!attendanceRes.ok) {
    const body = await attendanceRes.text().catch(() => "");
    throw new Error(
      `Failed to fetch attendance: ${attendanceRes.status} ${body}`,
    );
  }

  const attendance = (await attendanceRes.json()) as ApiAttendanceRow[];
  const rowsForSession = attendance.filter((r) => r.sessionId === sessionId);

  if (rowsForSession.length === 0 && !session) {
    return null;
  }

  let childNameMap = new Map<string, string>();
  try {
    const children = await fetchChildren();
    childNameMap = new Map(children.map((c) => [c.id, c.fullName]));
  } catch {
    // If children lookup fails, fallback to ids.
  }

  const rows = rowsForSession.map((r) => {
    const status = mapAttendanceStatus(r.present);
    return {
      childId: r.childId,
      childName: childNameMap.get(r.childId) ?? `Child ${r.childId}`,
      status,
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, unknown: 0 },
  );

  const timeRangeLabel =
    buildTimeRangeLabel(session?.startsAt, session?.endsAt) ?? "Time TBC";
  const date =
    session?.startsAt ??
    rowsForSession[0]?.timestamp ??
    new Date().toISOString();

  return {
    sessionId,
    title: session?.title ?? "Session",
    date,
    timeRangeLabel,
    roomLabel: session?.room ?? null,
    ageGroupLabel: session?.ageGroup ?? null,
    rows,
    summary,
    status:
      session?.status ??
      mapSessionStatus(session?.startsAt, session?.endsAt) ??
      "not_started",
  };
}

type ApiConcern = {
  id: string;
  childId?: string | null;
  child?: { firstName?: string | null; lastName?: string | null } | null;
  createdAt?: string;
  updatedAt?: string | null;
  status?: string | null;
  category?: string | null;
  summary?: string | null;
  details?: string | null;
  reportedByLabel?: string | null;
};

const safeReporterLabel = (label?: string | null) => {
  if (!label) return "Staff member";
  if (label.includes("@")) return "Staff member";
  return label;
};

const mapApiConcernToAdmin = (c: ApiConcern): AdminConcernRow => ({
  id: c.id,
  createdAt: c.createdAt ?? new Date().toISOString(),
  updatedAt: c.updatedAt ?? null,
  status:
    c.status === "open" || c.status === "in_review" || c.status === "closed"
      ? c.status
      : "other",
  category: c.category ?? null,
  // SAFEGUARDING: show initials/generic labels only, never full names or free text.
  childLabel: safeChildLabel(c.childId, c.child ?? null),
  reportedByLabel: safeReporterLabel(c.reportedByLabel),
});

export async function fetchOpenConcerns(): Promise<AdminConcernRow[]> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return [
      {
        id: "concern-1",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        status: "open",
        category: "Safeguarding",
        childLabel: "Child record",
        reportedByLabel: "Staff member",
      },
    ];
  }

  const res = await fetch(`${API_BASE_URL}/concerns`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch concerns: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiConcern[];

  return json
    .filter((c) => (c.status ?? "open") !== "closed") // basic open filter; backend filter preferred when available
    .map(mapApiConcernToAdmin)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

type ApiNote = {
  id: string;
  createdAt?: string;
  visibleToParents?: boolean;
};

export async function fetchNotesSummary(): Promise<AdminNotesSummary> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return { totalNotes: 2, visibleToParents: 0, staffOnly: 2 };
  }

  const res = await fetch(`${API_BASE_URL}/notes`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch notes: ${res.status} ${body || res.statusText}`,
    );
  }

  const notes = (await res.json()) as ApiNote[];
  const totalNotes = notes.length;
  const visibleToParents = notes.filter((n) => n.visibleToParents).length;
  const staffOnly = totalNotes - visibleToParents;

  return { totalNotes, visibleToParents, staffOnly };
}

type ApiEntitlements = {
  orgId: string;
  subscriptionStatus?: string;
  subscription?: {
    planCode?: string | null;
    status?: string | null;
    periodStart?: string | null;
    periodEnd?: string | null;
    cancelAtPeriodEnd?: boolean | null;
  };
  av30Cap?: number | null;
  storageGbCap?: number | null;
  smsMessagesCap?: number | null;
  leaderSeatsIncluded?: number | null;
  maxSites?: number | null;
  currentAv30?: number | null;
  storageGbUsage?: number | null;
  smsMonthUsage?: number | null;
  usageCalculatedAt?: string | null;
};

const mapApiEntitlementsToAdmin = (
  api: ApiEntitlements,
): AdminBillingOverview => ({
  orgId: api.orgId,
  subscriptionStatus: api.subscriptionStatus ?? "NONE",
  planCode: api.subscription?.planCode ?? null,
  periodStart: api.subscription?.periodStart ?? null,
  periodEnd: api.subscription?.periodEnd ?? null,
  cancelAtPeriodEnd: api.subscription?.cancelAtPeriodEnd ?? null,
  av30Cap: api.av30Cap ?? null,
  currentAv30: api.currentAv30 ?? null,
  storageGbCap: api.storageGbCap ?? null,
  storageGbUsage: api.storageGbUsage ?? null,
  smsMessagesCap: api.smsMessagesCap ?? null,
  smsMonthUsage: api.smsMonthUsage ?? null,
  leaderSeatsIncluded: api.leaderSeatsIncluded ?? null,
  maxSites: api.maxSites ?? null,
});

export async function fetchBillingOverview(): Promise<AdminBillingOverview> {
  // BILLING: high-level entitlements only. Do NOT surface card details or billing addresses.
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    return {
      orgId: "demo-org",
      subscriptionStatus: "ACTIVE",
      planCode: "demo_plan",
      periodStart: new Date().toISOString(),
      periodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      av30Cap: 50,
      currentAv30: 32,
      storageGbCap: 100,
      storageGbUsage: 12,
      smsMessagesCap: 1000,
      smsMonthUsage: 120,
      leaderSeatsIncluded: 10,
      maxSites: 3,
    };
  }

  const res = await fetch(`${API_BASE_URL}/billing/entitlements`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) {
      // TODO: replace fallback when a public entitlements endpoint is available.
      return {
        orgId: "unknown",
        subscriptionStatus: "NONE",
      };
    }
    const body = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch billing: ${res.status} ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as ApiEntitlements;
  return mapApiEntitlementsToAdmin(json);
}

type ApiOrg = {
  id: string;
  name: string;
  slug?: string | null;
  planCode?: string | null;
  isSuite?: boolean | null;
  // TODO: map site counts when available
};

const mapApiOrgToAdmin = (org: ApiOrg): AdminOrgOverview => ({
  id: org.id,
  name: org.name,
  slug: org.slug ?? null,
  isMultiSite: Boolean(org.isSuite), // TODO: confirm multi-site flag mapping
  planTier: org.planCode ?? null,
  siteCount: null,
});

// SETTINGS: org overview is metadata-only; do not surface secrets or API keys here.
export async function fetchOrgOverview(): Promise<AdminOrgOverview> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock once admin env is always configured.
    return {
      id: "mock-org",
      name: "Mock Organisation",
      slug: "mock-org",
      isMultiSite: false,
      planTier: null,
      siteCount: null,
    };
  }

  const res = await fetch(`${API_BASE_URL}/orgs`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch org: ${res.status} ${body}`);
  }

  const json = (await res.json()) as ApiOrg[];
  const firstOrg = json[0];
  if (!firstOrg) {
    return {
      id: "unknown",
      name: "Organisation",
      slug: null,
      isMultiSite: false,
      planTier: null,
      siteCount: null,
    };
  }

  return mapApiOrgToAdmin(firstOrg);
}

// SETTINGS: high-level retention config only; detailed policy text belongs in docs, not raw JSON here.
export async function fetchRetentionOverview(): Promise<AdminRetentionOverview | null> {
  // TODO: wire to real retention config endpoint when exposed.
  return null;
}

type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  hasServeAccess?: boolean | null;
  hasFamilyAccess?: boolean | null;
  status?: string | null;
  createdAt?: string;
};

const mapUserToStaffRow = (u: ApiUser): AdminStaffRow => {
  const roles: string[] = [];
  if (u.hasServeAccess) roles.push("Staff access");
  if (u.hasFamilyAccess) roles.push("Family access");
  const fullName =
    u.name ||
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
    "Unknown user";
  return {
    id: u.id,
    fullName,
    email: u.email,
    rolesLabel: roles.length ? roles.join(", ") : "—",
    status:
      u.status === "inactive"
        ? "inactive"
        : u.status === "active" || u.status === undefined || u.status === null
          ? "active"
          : "unknown", // TODO: BLOCKED – map real user status when API exposes it.
  };
};

const mapUserToStaffDetail = (u: ApiUser): AdminStaffDetail => {
  const roles: string[] = [];
  if (u.hasServeAccess) roles.push("Staff access");
  if (u.hasFamilyAccess) roles.push("Family access");
  const fullName =
    u.name ||
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
    "Unknown user";
  return {
    id: u.id,
    fullName,
    email: u.email,
    roles,
    primaryRoleLabel: roles[0] ?? null,
    status:
      u.status === "inactive"
        ? "inactive"
        : u.status === "active" || u.status === undefined || u.status === null
          ? "active"
          : "unknown", // TODO: BLOCKED – map real user status when API exposes it.
    groups: undefined, // TODO: map staff groups/classes when API exposes them.
    sessionsCount: undefined, // TODO: derive from assignments when available.
  };
};

// PEOPLE: high-level staff metadata only. No auth tokens or logs.
export async function fetchStaff(): Promise<AdminStaffRow[]> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return [
      {
        id: "u1",
        fullName: "Alex Morgan",
        email: "alex.morgan@example.edu",
        rolesLabel: "Staff access",
        status: "active",
      },
      {
        id: "u2",
        fullName: "Jamie Lee",
        email: "jamie.lee@example.edu",
        rolesLabel: "Family access",
        status: "active",
      },
    ];
  }

  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch users: ${res.status} ${body}`);
  }

  const json = (await res.json()) as ApiUser[];
  return json.map(mapUserToStaffRow);
}

export async function fetchStaffById(
  userId: string,
): Promise<AdminStaffDetail | null> {
  const useMock = !process.env.NEXT_PUBLIC_API_BASE_URL;
  if (useMock) {
    // TODO: remove mock fallback once admin env always sets NEXT_PUBLIC_API_BASE_URL.
    return {
      id: userId,
      fullName: "Alex Morgan",
      email: "alex.morgan@example.edu",
      roles: ["Staff access"],
      primaryRoleLabel: "Staff access",
      status: "active",
      groups: [],
      sessionsCount: null,
    };
  }

  const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: buildAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch user: ${res.status} ${body}`);
  }

  const json = (await res.json()) as ApiUser;
  return mapUserToStaffDetail(json);
}
