import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AttendanceService } from "../attendance.service";
import { prisma } from "@pathway/db";

// --- Prisma mocks
const aFindMany = jest.spyOn(prisma.attendance, "findMany");
const aFindUnique = jest.spyOn(prisma.attendance, "findUnique");
const aCreate = jest.spyOn(prisma.attendance, "create");
const aUpdate = jest.spyOn(prisma.attendance, "update");

const cFindUnique = jest.spyOn(prisma.child, "findUnique");
const gFindUnique = jest.spyOn(prisma.group, "findUnique");

describe("AttendanceService", () => {
  let svc: AttendanceService;

  const makeChild = (tenantId: string) => ({
    id: "" as string,
    groupId: null,
    firstName: "Test",
    lastName: "Child",
    allergies: "none",
    photoKey: null,
    notes: null,
    tenantId,
    disabilities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const makeGroup = (tenantId: string) => ({
    id: "" as string,
    name: "Group A",
    tenantId,
    minAge: 3,
    maxAge: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    aFindMany.mockReset();
    aFindUnique.mockReset();
    aCreate.mockReset();
    aUpdate.mockReset();
    cFindUnique.mockReset();
    gFindUnique.mockReset();
    svc = new AttendanceService();
  });

  describe("list", () => {
    it("returns attendance ordered by timestamp desc", async () => {
      aFindMany.mockResolvedValueOnce([]);
      const res = await svc.list();
      expect(res).toEqual([]);
      expect(aFindMany).toHaveBeenCalledWith({
        select: {
          id: true,
          childId: true,
          groupId: true,
          present: true,
          timestamp: true,
        },
        orderBy: [{ timestamp: "desc" }],
      });
    });
  });

  describe("getById", () => {
    it("returns a record when found", async () => {
      const row = {
        id: "att1",
        childId: "c1",
        groupId: "g1",
        present: true,
        timestamp: new Date(),
      };
      aFindUnique.mockResolvedValueOnce(row);
      const res = await svc.getById("att1");
      expect(res).toBe(row);
      expect(aFindUnique).toHaveBeenCalledWith({
        where: { id: "att1" },
        select: {
          id: true,
          childId: true,
          groupId: true,
          present: true,
          timestamp: true,
        },
      });
    });

    it("throws NotFound when missing", async () => {
      aFindUnique.mockResolvedValueOnce(null);
      await expect(svc.getById("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    const childId = "11111111-1111-1111-1111-111111111111";
    const groupSame = "22222222-2222-2222-2222-222222222222";
    const groupOther = "33333333-3333-3333-3333-333333333333";

    it("throws when child not found", async () => {
      cFindUnique.mockResolvedValueOnce(null);
      await expect(
        svc.create({ childId, groupId: groupSame, present: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when group not found", async () => {
      cFindUnique.mockResolvedValueOnce({
        ...makeChild("t1"),
        id: childId,
      } as Awaited<ReturnType<typeof prisma.child.findUnique>>);
      gFindUnique.mockResolvedValueOnce(null);
      await expect(
        svc.create({ childId, groupId: groupSame, present: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when child and group are in different tenants", async () => {
      cFindUnique.mockResolvedValueOnce({
        ...makeChild("t1"),
        id: childId,
      } as Awaited<ReturnType<typeof prisma.child.findUnique>>);
      gFindUnique.mockResolvedValueOnce({
        ...makeGroup("t2"),
        id: groupOther,
      } as Awaited<ReturnType<typeof prisma.group.findUnique>>);
      await expect(
        svc.create({ childId, groupId: groupOther, present: true }),
      ).rejects.toEqual(
        new BadRequestException("child and group must belong to same tenant"),
      );
    });

    it("creates with default timestamp when not provided", async () => {
      cFindUnique.mockResolvedValueOnce({
        ...makeChild("t1"),
        id: childId,
      } as Awaited<ReturnType<typeof prisma.child.findUnique>>);
      gFindUnique.mockResolvedValueOnce({
        ...makeGroup("t1"),
        id: groupSame,
      } as Awaited<ReturnType<typeof prisma.group.findUnique>>);
      aCreate.mockResolvedValueOnce({
        id: "att1",
        childId,
        groupId: groupSame,
        present: true,
        timestamp: new Date(),
      });

      const res = await svc.create({
        childId,
        groupId: groupSame,
        present: true,
      });
      expect(res).toMatchObject({
        id: "att1",
        childId,
        groupId: groupSame,
        present: true,
      });
      expect(aCreate).toHaveBeenCalledWith({
        data: {
          child: { connect: { id: childId } },
          group: { connect: { id: groupSame } },
          present: true,
          timestamp: expect.any(Date),
        },
        select: {
          id: true,
          childId: true,
          groupId: true,
          present: true,
          timestamp: true,
        },
      });
    });

    it("creates with provided timestamp", async () => {
      const ts = new Date("2025-01-01T10:00:00.000Z");
      cFindUnique.mockResolvedValueOnce({
        ...makeChild("t1"),
        id: childId,
      } as Awaited<ReturnType<typeof prisma.child.findUnique>>);
      gFindUnique.mockResolvedValueOnce({
        ...makeGroup("t1"),
        id: groupSame,
      } as Awaited<ReturnType<typeof prisma.group.findUnique>>);
      aCreate.mockResolvedValueOnce({
        id: "att2",
        childId,
        groupId: groupSame,
        present: false,
        timestamp: ts,
      });

      const res = await svc.create({
        childId,
        groupId: groupSame,
        present: false,
        timestamp: ts,
      });
      expect(res.timestamp).toEqual(ts);
      expect(aCreate).toHaveBeenCalledWith({
        data: {
          child: { connect: { id: childId } },
          group: { connect: { id: groupSame } },
          present: false,
          timestamp: ts,
        },
        select: {
          id: true,
          childId: true,
          groupId: true,
          present: true,
          timestamp: true,
        },
      });
    });
  });

  describe("update", () => {
    const id = "44444444-4444-4444-4444-444444444444";
    const newGroup = "55555555-5555-5555-5555-555555555555";

    it("throws NotFound if attendance missing", async () => {
      aFindUnique.mockResolvedValueOnce(null);
      await expect(svc.update(id, { present: false })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("updates present only", async () => {
      aFindUnique.mockResolvedValueOnce({
        id,
        child: { tenantId: "t1" },
      } as unknown as Awaited<ReturnType<typeof prisma.attendance.findUnique>>);
      aUpdate.mockResolvedValueOnce({
        id,
        childId: "c1",
        groupId: "g1",
        present: false,
        timestamp: new Date(),
      });

      const res = await svc.update(id, { present: false });
      expect(res.present).toBe(false);
      expect(aUpdate).toHaveBeenCalledWith({
        where: { id },
        data: { present: false, timestamp: undefined },
        select: {
          id: true,
          childId: true,
          groupId: true,
          present: true,
          timestamp: true,
        },
      });
    });

    it("throws when changing group across tenants", async () => {
      aFindUnique.mockResolvedValueOnce({
        id,
        child: { tenantId: "t1" },
      } as unknown as Awaited<ReturnType<typeof prisma.attendance.findUnique>>);
      gFindUnique.mockResolvedValueOnce({
        ...makeGroup("t2"),
        id: newGroup,
      } as Awaited<ReturnType<typeof prisma.group.findUnique>>);

      await expect(svc.update(id, { groupId: newGroup })).rejects.toEqual(
        new BadRequestException("group does not belong to the child's tenant"),
      );
    });

    it("connects new group when same tenant", async () => {
      aFindUnique.mockResolvedValueOnce({
        id,
        child: { tenantId: "t1" },
      } as unknown as Awaited<ReturnType<typeof prisma.attendance.findUnique>>);
      gFindUnique.mockResolvedValueOnce({
        ...makeGroup("t1"),
        id: newGroup,
      } as Awaited<ReturnType<typeof prisma.group.findUnique>>);
      aUpdate.mockResolvedValueOnce({
        id,
        childId: "c1",
        groupId: newGroup,
        present: true,
        timestamp: new Date(),
      });

      await svc.update(id, { groupId: newGroup });
      expect(aUpdate).toHaveBeenCalledWith({
        where: { id },
        data: {
          present: undefined,
          timestamp: undefined,
          group: { connect: { id: newGroup } },
        },
        select: {
          id: true,
          childId: true,
          groupId: true,
          present: true,
          timestamp: true,
        },
      });
    });
  });
});
