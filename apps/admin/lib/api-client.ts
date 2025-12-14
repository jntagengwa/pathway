export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
