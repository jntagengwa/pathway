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
import { PathwayRequestContext, UserTenantRole } from "@pathway/auth";
import { Av30ActivityType } from "@pathway/types/av30";
// Handy typed helpers for casting prisma method to jest.Mock without using `any`
const asMock = (fn) => fn;
describe("AssignmentsService", () => {
    let service;
    let mockAv30Service;
    let mockRequestContext;
    const createMockContext = () => {
        const context = {
            user: {
                userId: "user-123",
                email: "staff@example.com",
                authProvider: "debug",
            },
            org: {
                orgId: "org-123",
                auth0OrgId: "auth0|org123",
            },
            tenant: {
                tenantId: "tenant-123",
                orgId: "org-123",
            },
            roles: {
                org: [],
                tenant: [UserTenantRole.TEACHER],
            },
            permissions: [],
            rawClaims: {},
        };
        const mockRequest = {};
        const ctx = new PathwayRequestContext(mockRequest);
        ctx.setContext(context);
        return ctx;
    };
    const now = new Date();
    const baseAssignment = {
        id: "11111111-1111-1111-1111-111111111111",
        sessionId: "22222222-2222-2222-2222-222222222222",
        userId: "33333333-3333-3333-3333-333333333333",
        role: Role.TEACHER,
        status: AssignmentStatus.CONFIRMED,
        createdAt: now,
        updatedAt: now,
    };
    beforeEach(() => {
        jest.clearAllMocks();
        mockAv30Service = {
            recordActivityForCurrentUser: jest.fn().mockResolvedValue(undefined),
            recordActivity: jest.fn().mockResolvedValue(undefined),
        };
        mockRequestContext = createMockContext();
        service = new AssignmentsService(mockAv30Service, mockRequestContext);
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
        const dto = {
            sessionId: baseAssignment.sessionId,
            userId: baseAssignment.userId,
            role: baseAssignment.role,
            status: AssignmentStatus.CONFIRMED,
        };
        const created = await service.create(dto, "tenant-1");
        expect(prisma.assignment.create).toHaveBeenCalledWith({ data: dto });
        expect(created).toEqual(baseAssignment);
        // Verify AV30 activity was recorded for assignment creation
        expect(mockAv30Service.recordActivity).toHaveBeenCalledTimes(1);
        expect(mockAv30Service.recordActivity).toHaveBeenCalledWith(mockRequestContext, {
            activityType: Av30ActivityType.ASSIGNMENT_PUBLISHED,
            staffUserId: baseAssignment.userId,
        });
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
        expect(prisma.assignment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                session: { tenantId: "tenant-1" },
                sessionId: baseAssignment.sessionId,
                userId: baseAssignment.userId,
                role: baseAssignment.role,
                status: baseAssignment.status,
            },
            orderBy: { createdAt: "desc" },
        }));
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
        const updateDto = {
            status: AssignmentStatus.DECLINED,
            role: Role.COORDINATOR,
        };
        const updated = { ...baseAssignment, ...updateDto, updatedAt: new Date() };
        asMock(prisma.assignment.findFirst).mockResolvedValue({
            id: baseAssignment.id,
            userId: baseAssignment.userId,
            status: baseAssignment.status,
        });
        asMock(prisma.assignment.update).mockResolvedValue(updated);
        const result = await service.update(baseAssignment.id, updateDto, "tenant-1");
        expect(prisma.assignment.update).toHaveBeenCalledWith({
            where: { id: baseAssignment.id },
            data: updateDto,
        });
        expect(result).toEqual(updated);
        // Verify AV30 activity was recorded for assignment decline
        expect(mockAv30Service.recordActivity).toHaveBeenCalledTimes(1);
        expect(mockAv30Service.recordActivity).toHaveBeenCalledWith(mockRequestContext, {
            activityType: Av30ActivityType.ASSIGNMENT_DECLINED,
            staffUserId: baseAssignment.userId,
        });
    });
    it("should record AV30 activity when assignment status changes to CONFIRMED", async () => {
        const updateDto = {
            status: AssignmentStatus.CONFIRMED,
        };
        const updated = { ...baseAssignment, ...updateDto, updatedAt: new Date() };
        asMock(prisma.assignment.findFirst).mockResolvedValue({
            id: baseAssignment.id,
            userId: baseAssignment.userId,
            status: AssignmentStatus.PENDING,
        });
        asMock(prisma.assignment.update).mockResolvedValue(updated);
        await service.update(baseAssignment.id, updateDto, "tenant-1");
        // Verify AV30 activity was recorded for assignment acceptance
        expect(mockAv30Service.recordActivity).toHaveBeenCalledTimes(1);
        expect(mockAv30Service.recordActivity).toHaveBeenCalledWith(mockRequestContext, {
            activityType: Av30ActivityType.ASSIGNMENT_ACCEPTED,
            staffUserId: baseAssignment.userId,
        });
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
