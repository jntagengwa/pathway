var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, NotFoundException, } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { PathwayRequestContext } from "@pathway/auth";
import { Av30ActivityType } from "@pathway/types/av30";
import { Av30ActivityService } from "../av30/av30-activity.service";
const SELECT = {
    id: true,
    childId: true,
    groupId: true,
    present: true,
    timestamp: true,
    sessionId: true,
};
let AttendanceService = class AttendanceService {
    av30ActivityService;
    requestContext;
    constructor(av30ActivityService, requestContext) {
        this.av30ActivityService = av30ActivityService;
        this.requestContext = requestContext;
    }
    async list(tenantId) {
        return prisma.attendance.findMany({
            where: { child: { tenantId } },
            select: SELECT,
            orderBy: [{ timestamp: "desc" }],
        });
    }
    async getById(id, tenantId) {
        const row = await prisma.attendance.findFirst({
            where: { id, child: { tenantId } },
            select: SELECT,
        });
        if (!row)
            throw new NotFoundException("Attendance not found");
        return row;
    }
    async create(input, tenantId) {
        // Validate child exists
        const child = await prisma.child.findUnique({
            where: { id: input.childId },
            select: { id: true, tenantId: true },
        });
        if (!child || child.tenantId !== tenantId)
            throw new NotFoundException("Attendance not found");
        // Validate group exists
        const group = await prisma.group.findUnique({
            where: { id: input.groupId },
            select: { id: true, tenantId: true },
        });
        if (!group || group.tenantId !== tenantId)
            throw new NotFoundException("Attendance not found");
        // Optional: validate session exists and is consistent
        if (input.sessionId) {
            const session = await prisma.session.findUnique({
                where: { id: input.sessionId },
                select: { id: true, tenantId: true, groupId: true },
            });
            if (!session || session.tenantId !== tenantId) {
                throw new NotFoundException("Attendance not found");
            }
            if (session.groupId && session.groupId !== input.groupId) {
                throw new BadRequestException("session is for a different group");
            }
        }
        // Cross-tenant guard
        if (child.tenantId !== group.tenantId)
            throw new BadRequestException("child and group must belong to same tenant");
        const created = await prisma.attendance.create({
            data: {
                child: { connect: { id: input.childId } },
                group: { connect: { id: input.groupId } },
                present: input.present,
                timestamp: input.timestamp ?? new Date(),
                ...(input.sessionId
                    ? { session: { connect: { id: input.sessionId } } }
                    : {}),
            },
            select: SELECT,
        });
        // Record AV30 activity: staff user recorded attendance
        await this.av30ActivityService
            .recordActivityForCurrentUser(this.requestContext, Av30ActivityType.ATTENDANCE_RECORDED, input.timestamp ?? new Date())
            .catch((err) => {
            // Log but don't fail the attendance creation if AV30 recording fails
            console.error("Failed to record AV30 activity for attendance", err);
        });
        return created;
    }
    async update(id, input, tenantId) {
        // Ensure row exists (also used to infer tenant via relations if needed)
        const current = await prisma.attendance.findFirst({
            where: { id, child: { tenantId } },
            select: {
                id: true,
                groupId: true,
                child: { select: { tenantId: true } },
            },
        });
        if (!current)
            throw new NotFoundException("Attendance not found");
        // If groupId is changing, ensure cross-tenant safety with the child's tenant
        if (input.groupId) {
            const group = await prisma.group.findUnique({
                where: { id: input.groupId },
                select: { id: true, tenantId: true },
            });
            if (!group || group.tenantId !== tenantId) {
                throw new NotFoundException("Attendance not found");
            }
            if (group.tenantId !== current.child.tenantId) {
                throw new BadRequestException("group does not belong to the child's tenant");
            }
        }
        // Optional: validate session exists and is consistent
        if (input.sessionId) {
            const session = await prisma.session.findUnique({
                where: { id: input.sessionId },
                select: { id: true, tenantId: true, groupId: true },
            });
            if (!session || session.tenantId !== tenantId) {
                throw new NotFoundException("Attendance not found");
            }
            // If either the incoming groupId or the current groupId exists, ensure it matches the session's group (when session has one)
            const effectiveGroupId = input.groupId ?? current.groupId ?? undefined;
            if (session.groupId &&
                effectiveGroupId &&
                session.groupId !== effectiveGroupId) {
                throw new BadRequestException("session is for a different group");
            }
        }
        const updated = await prisma.attendance.update({
            where: { id },
            data: {
                present: input.present ?? undefined,
                timestamp: input.timestamp ?? undefined,
                ...(input.groupId ? { group: { connect: { id: input.groupId } } } : {}),
                ...(input.sessionId
                    ? { session: { connect: { id: input.sessionId } } }
                    : {}),
            },
            select: SELECT,
        });
        // Record AV30 activity: staff user updated attendance
        await this.av30ActivityService
            .recordActivityForCurrentUser(this.requestContext, Av30ActivityType.ATTENDANCE_RECORDED, input.timestamp ?? updated.timestamp)
            .catch((err) => {
            // Log but don't fail the attendance update if AV30 recording fails
            console.error("Failed to record AV30 activity for attendance update", err);
        });
        return updated;
    }
};
AttendanceService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Av30ActivityService,
        PathwayRequestContext])
], AttendanceService);
export { AttendanceService };
