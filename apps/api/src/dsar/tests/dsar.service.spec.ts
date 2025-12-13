import { NotFoundException } from "@nestjs/common";
import { DsarService } from "../dsar.service";

const prismaMock = {
  child: { findFirst: jest.fn() },
  user: { findMany: jest.fn() },
  attendance: { findMany: jest.fn() },
  childNote: { findMany: jest.fn() },
  concern: { findMany: jest.fn() },
  session: { findMany: jest.fn() },
};

jest.mock("@pathway/db", () => {
  const actual = jest.requireActual("@pathway/db");
  return {
    ...actual,
    get prisma() {
      return prismaMock;
    },
  };
});

describe("DsarService", () => {
  const tenantId = "tenant-1";
  const childId = "child-1";
  let service: DsarService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DsarService();
  });

  it("exports child data with related entities", async () => {
    prismaMock.child.findFirst.mockResolvedValue({
      id: childId,
      firstName: "Amy",
      lastName: "Jones",
      allergies: "nuts",
      disabilities: ["dyslexia"],
      notes: "prefers small groups",
      group: { id: "g1", name: "Group A", minAge: 8, maxAge: 10 },
    });
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "u1",
        email: "parent@example.com",
        name: "Parent One",
        hasFamilyAccess: true,
      },
    ]);
    prismaMock.attendance.findMany.mockResolvedValue([
      {
        id: "att1",
        groupId: "g1",
        sessionId: "s1",
        present: true,
        timestamp: new Date("2025-01-01T10:00:00Z"),
      },
    ]);
    prismaMock.childNote.findMany.mockResolvedValue([
      {
        id: "n1",
        text: "Great progress",
        authorId: "teacher-1",
        createdAt: new Date("2025-01-02T09:00:00Z"),
      },
    ]);
    prismaMock.concern.findMany.mockResolvedValue([
      {
        id: "c1",
        summary: "Late pickup",
        details: "Occasional lateness",
        createdAt: new Date("2025-01-03T12:00:00Z"),
      },
    ]);
    prismaMock.session.findMany.mockResolvedValue([
      {
        id: "s1",
        groupId: "g1",
        startsAt: new Date("2025-01-01T09:00:00Z"),
        endsAt: new Date("2025-01-01T10:00:00Z"),
        title: "Maths",
      },
    ]);

    const result = await service.exportChild(childId, tenantId);

    expect(prismaMock.child.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: childId, tenantId },
      }),
    );
    expect(result.child.id).toBe(childId);
    expect(result.parents).toHaveLength(1);
    expect(result.attendance[0].sessionId).toBe("s1");
    expect(result.sessions[0].id).toBe("s1");
    expect(result.concerns).toHaveLength(1);
    expect(result.notes).toHaveLength(1);
  });

  it("throws NotFound when child is not in tenant", async () => {
    prismaMock.child.findFirst.mockResolvedValue(null);

    await expect(service.exportChild(childId, tenantId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

