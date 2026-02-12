import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { StaffAttendanceService } from "../staff-attendance.service";
import { prisma } from "@pathway/db";

const sessionFindFirst = jest.spyOn(prisma.session, "findFirst");
const sessionStaffAttendanceUpsert = jest.spyOn(
  prisma.sessionStaffAttendance,
  "upsert",
);
const tenantFindUnique = jest.spyOn(prisma.tenant, "findUnique");
const siteMembershipFindFirst = jest.spyOn(
  prisma.siteMembership,
  "findFirst",
);
const orgMembershipFindFirst = jest.spyOn(
  prisma.orgMembership,
  "findFirst",
);
const userTenantRoleFindFirst = jest.spyOn(
  prisma.userTenantRole,
  "findFirst",
);

describe("StaffAttendanceService", () => {
  let svc: StaffAttendanceService;

  const tenantId = "tenant-123";
  const orgId = "org-1";
  const sessionId = "session-123";
  const staffUserId = "user-456";
  const actorUserId = "actor-1";

  const mockCanMark = (siteRole?: "SITE_ADMIN" | "STAFF" | "VIEWER" | null, orgAdmin = true) => {
    tenantFindUnique.mockResolvedValue({ id: tenantId, orgId } as never);
    siteMembershipFindFirst.mockResolvedValue(
      siteRole ? ({ role: siteRole } as never) : null,
    );
    orgMembershipFindFirst.mockResolvedValue(
      orgAdmin ? ({ role: "ORG_ADMIN" } as never) : null,
    );
    userTenantRoleFindFirst.mockResolvedValue(null);
  };

  const mockCannotMark = () => {
    tenantFindUnique.mockResolvedValue({ id: tenantId, orgId } as never);
    siteMembershipFindFirst.mockResolvedValue({ role: "VIEWER" } as never);
    orgMembershipFindFirst.mockResolvedValue(null);
    userTenantRoleFindFirst.mockResolvedValue(null);
  };

  const sessionWithAssignments = {
    id: sessionId,
    tenantId,
    assignments: [
      {
        userId: staffUserId,
        role: "TEACHER",
        user: {
          id: staffUserId,
          displayName: "Jane Doe",
          name: null,
          firstName: "Jane",
          lastName: "Doe",
        },
      },
    ],
    sessionStaffAttendance: [] as { staffUserId: string; status: string }[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new StaffAttendanceService();
    mockCanMark("STAFF", true);
  });

  describe("getRoster", () => {
    it("returns roster for assigned staff", async () => {
      sessionFindFirst.mockResolvedValueOnce(sessionWithAssignments as never);

      const roster = await svc.getRoster(sessionId, tenantId);

      expect(roster).toHaveLength(1);
      expect(roster[0]).toMatchObject({
        staffUserId,
        displayName: "Jane Doe",
        roleLabel: "Lead",
        assigned: true,
        attendanceStatus: "UNKNOWN",
      });
      expect(sessionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: sessionId, tenantId },
        }),
      );
    });

    it("throws NotFound when session not found", async () => {
      sessionFindFirst.mockResolvedValueOnce(null);

      await expect(svc.getRoster(sessionId, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("includes existing attendance status", async () => {
      sessionFindFirst.mockResolvedValueOnce({
        ...sessionWithAssignments,
        sessionStaffAttendance: [
          { staffUserId, status: "PRESENT" },
        ],
      } as never);

      const roster = await svc.getRoster(sessionId, tenantId);

      expect(roster[0].attendanceStatus).toBe("PRESENT");
    });
  });

  describe("upsert", () => {
    it("rejects VIEWER role", async () => {
      mockCannotMark();
      sessionFindFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        assignments: [{ userId: staffUserId }],
      } as never);

      await expect(
        svc.upsert(sessionId, tenantId, actorUserId, {
          staffUserId,
          status: "PRESENT",
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(sessionStaffAttendanceUpsert).not.toHaveBeenCalled();
    });

    it("upserts when staff is assigned", async () => {
      let findFirstCallCount = 0;
      (sessionFindFirst as jest.Mock).mockImplementation(() => {
        findFirstCallCount++;
        if (findFirstCallCount === 1) {
          return Promise.resolve({
            id: sessionId,
            tenantId,
            assignments: [{ userId: staffUserId }],
          });
        }
        return Promise.resolve({
          ...sessionWithAssignments,
          sessionStaffAttendance: [{ staffUserId, status: "PRESENT" }],
        });
      });
      sessionStaffAttendanceUpsert.mockResolvedValue({
        id: "att-1",
        tenantId,
        sessionId,
        staffUserId,
        status: "PRESENT",
        markedByUserId: "actor-1",
        markedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const roster = await svc.upsert(sessionId, tenantId, actorUserId, {
        staffUserId,
        status: "PRESENT",
      });

      expect(sessionStaffAttendanceUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_sessionId_staffUserId: {
              tenantId,
              sessionId,
              staffUserId,
            },
          },
          create: expect.objectContaining({
            tenantId,
            sessionId,
            staffUserId,
            status: "PRESENT",
            markedByUserId: "actor-1",
          }),
          update: expect.objectContaining({
            status: "PRESENT",
            markedByUserId: "actor-1",
          }),
        }),
      );
      expect(roster).toHaveLength(1);
    });

    it("throws when staff not assigned to session", async () => {
      sessionFindFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        assignments: [],
      } as never);

      await expect(
        svc.upsert(sessionId, tenantId, actorUserId, {
          staffUserId,
          status: "PRESENT",
        }),
      ).rejects.toThrow("Staff member is not assigned to this session");

      expect(sessionStaffAttendanceUpsert).not.toHaveBeenCalled();
    });

    it("throws NotFound when session not found", async () => {
      sessionFindFirst.mockResolvedValue(null as never);

      await expect(
        svc.upsert(sessionId, tenantId, actorUserId, {
          staffUserId,
          status: "PRESENT",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
