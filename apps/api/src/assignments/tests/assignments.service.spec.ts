// Mock @pathway/db *first* so the service under test uses the mocked prisma
jest.mock("@pathway/db", () => {
  const actual = jest.requireActual("@pathway/db");

  // Build isolated jest.fn()s inside the factory to avoid hoisting issues
  const assignment = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const session = {
    findUnique: jest.fn(),
  };
  const user = {
    findUnique: jest.fn(),
  };

  return {
    ...actual,
    prisma: {
      ...actual.prisma,
      assignment,
      session,
      user,
    },
  };
});

import { AssignmentsService } from "../assignments.service";
import { Role, AssignmentStatus, prisma } from "@pathway/db";
import { CreateAssignmentDto } from "../dto/create-assignment.dto";
import { UpdateAssignmentDto } from "../dto/update-assignment.dto";

// Handy typed helpers for casting prisma method to jest.Mock without using `any`
const asMock = (fn: unknown): jest.Mock => fn as unknown as jest.Mock;

describe("AssignmentsService", () => {
  let service: AssignmentsService;

  const now = new Date();
  const baseAssignment = {
    id: "11111111-1111-1111-1111-111111111111",
    sessionId: "22222222-2222-2222-2222-222222222222",
    userId: "33333333-3333-3333-3333-333333333333",
    role: Role.TEACHER,
    status: AssignmentStatus.CONFIRMED,
    createdAt: now,
    updatedAt: now,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssignmentsService();
  });

  it("should create an assignment", async () => {
    asMock(prisma.assignment.create).mockResolvedValue(baseAssignment);
    asMock(prisma.session.findUnique).mockResolvedValue({
      id: baseAssignment.sessionId,
      tenantId: "tenant-1",
    });
    asMock(prisma.user.findUnique).mockResolvedValue({
      id: baseAssignment.userId,
      tenantId: "tenant-1",
    });

    const dto: CreateAssignmentDto = {
      sessionId: baseAssignment.sessionId,
      userId: baseAssignment.userId,
      role: baseAssignment.role,
      status: AssignmentStatus.CONFIRMED,
    };

    const created = await service.create(dto, "tenant-1");

    expect(prisma.assignment.create).toHaveBeenCalledWith({ data: dto });
    expect(created).toEqual(baseAssignment);
  });

  it("should list assignments (with optional filters)", async () => {
    asMock(prisma.assignment.findMany).mockResolvedValue([baseAssignment]);

    const result = await service.findAll({
      tenantId: "tenant-1",
      sessionId: baseAssignment.sessionId,
      userId: baseAssignment.userId,
      role: baseAssignment.role,
      status: baseAssignment.status,
    });

    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          session: { tenantId: "tenant-1" },
          sessionId: baseAssignment.sessionId,
          userId: baseAssignment.userId,
          role: baseAssignment.role,
          status: baseAssignment.status,
        },
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(result).toEqual([baseAssignment]);
  });

  it("should get a single assignment by id", async () => {
    asMock(prisma.assignment.findFirst).mockResolvedValue(baseAssignment);

    const result = await service.findOne(baseAssignment.id, "tenant-1");

    expect(prisma.assignment.findFirst).toHaveBeenCalledWith({
      where: { id: baseAssignment.id, session: { tenantId: "tenant-1" } },
    });
    expect(result).toEqual(baseAssignment);
  });

  it("should update an assignment", async () => {
    const updateDto: UpdateAssignmentDto = {
      status: AssignmentStatus.DECLINED,
      role: Role.COORDINATOR,
    };

    const updated = { ...baseAssignment, ...updateDto, updatedAt: new Date() };
    asMock(prisma.assignment.findFirst).mockResolvedValue({
      id: baseAssignment.id,
    });
    asMock(prisma.assignment.update).mockResolvedValue(updated);

    const result = await service.update(
      baseAssignment.id,
      updateDto,
      "tenant-1",
    );

    expect(prisma.assignment.update).toHaveBeenCalledWith({
      where: { id: baseAssignment.id },
      data: updateDto,
    });
    expect(result).toEqual(updated);
  });

  it("should delete an assignment", async () => {
    asMock(prisma.assignment.findFirst).mockResolvedValue(baseAssignment);
    asMock(prisma.assignment.delete).mockResolvedValue(baseAssignment);

    const result = await service.remove(baseAssignment.id, "tenant-1");

    expect(prisma.assignment.delete).toHaveBeenCalledWith({
      where: { id: baseAssignment.id },
    });
    expect(result).toEqual(baseAssignment);
  });
});
