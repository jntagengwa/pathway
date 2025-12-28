var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { LeadKind } from "@prisma/client";
let LeadsService = class LeadsService {
    /**
     * Idempotency window: if a lead with the same email+kind was created
     * within this window, we update the existing record instead of creating a new one.
     */
    IDEMPOTENCY_WINDOW_HOURS = 2;
    async findRecentLead(email, kind) {
        const windowStart = new Date();
        windowStart.setHours(windowStart.getHours() - this.IDEMPOTENCY_WINDOW_HOURS);
        const recent = await prisma.lead.findFirst({
            where: {
                email: email.toLowerCase(),
                kind,
                createdAt: {
                    gte: windowStart,
                },
            },
            select: { id: true },
            orderBy: { createdAt: "desc" },
        });
        return recent;
    }
    async createDemoLead(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const existing = await this.findRecentLead(normalizedEmail, LeadKind.DEMO);
        if (existing) {
            // Update existing lead
            return prisma.lead.update({
                where: { id: existing.id },
                data: {
                    name: dto.name.trim(),
                    organisation: dto.organisation?.trim() || null,
                    role: dto.role?.trim() || null,
                    sector: dto.sector?.trim() || null,
                    message: dto.message?.trim() || null,
                    utmSource: dto.utm?.source?.trim() || null,
                    utmMedium: dto.utm?.medium?.trim() || null,
                    utmCampaign: dto.utm?.campaign?.trim() || null,
                    updatedAt: new Date(),
                },
                select: { id: true, kind: true, createdAt: true },
            });
        }
        return prisma.lead.create({
            data: {
                kind: LeadKind.DEMO,
                email: normalizedEmail,
                name: dto.name.trim(),
                organisation: dto.organisation?.trim() || null,
                role: dto.role?.trim() || null,
                sector: dto.sector?.trim() || null,
                message: dto.message?.trim() || null,
                utmSource: dto.utm?.source?.trim() || null,
                utmMedium: dto.utm?.medium?.trim() || null,
                utmCampaign: dto.utm?.campaign?.trim() || null,
            },
            select: { id: true, kind: true, createdAt: true },
        });
    }
    async createToolkitLead(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const existing = await this.findRecentLead(normalizedEmail, LeadKind.TOOLKIT);
        if (existing) {
            return prisma.lead.update({
                where: { id: existing.id },
                data: {
                    name: dto.name?.trim() || null,
                    organisation: dto.organisation?.trim() || null,
                    role: dto.role?.trim() || null,
                    sector: dto.sector?.trim() || null,
                    utmSource: dto.utm?.source?.trim() || null,
                    utmMedium: dto.utm?.medium?.trim() || null,
                    utmCampaign: dto.utm?.campaign?.trim() || null,
                    updatedAt: new Date(),
                },
                select: { id: true, kind: true, createdAt: true },
            });
        }
        return prisma.lead.create({
            data: {
                kind: LeadKind.TOOLKIT,
                email: normalizedEmail,
                name: dto.name?.trim() || null,
                organisation: dto.organisation?.trim() || null,
                role: dto.role?.trim() || null,
                sector: dto.sector?.trim() || null,
                utmSource: dto.utm?.source?.trim() || null,
                utmMedium: dto.utm?.medium?.trim() || null,
                utmCampaign: dto.utm?.campaign?.trim() || null,
            },
            select: { id: true, kind: true, createdAt: true },
        });
    }
    async createTrialLead(dto) {
        const normalizedEmail = dto.email.toLowerCase().trim();
        const existing = await this.findRecentLead(normalizedEmail, LeadKind.TRIAL);
        if (existing) {
            return prisma.lead.update({
                where: { id: existing.id },
                data: {
                    name: dto.name?.trim() || null,
                    organisation: dto.organisation?.trim() || null,
                    sector: dto.sector?.trim() || null,
                    utmSource: dto.utm?.source?.trim() || null,
                    utmMedium: dto.utm?.medium?.trim() || null,
                    utmCampaign: dto.utm?.campaign?.trim() || null,
                    updatedAt: new Date(),
                },
                select: { id: true, kind: true, createdAt: true },
            });
        }
        return prisma.lead.create({
            data: {
                kind: LeadKind.TRIAL,
                email: normalizedEmail,
                name: dto.name?.trim() || null,
                organisation: dto.organisation?.trim() || null,
                sector: dto.sector?.trim() || null,
                utmSource: dto.utm?.source?.trim() || null,
                utmMedium: dto.utm?.medium?.trim() || null,
                utmCampaign: dto.utm?.campaign?.trim() || null,
            },
            select: { id: true, kind: true, createdAt: true },
        });
    }
};
LeadsService = __decorate([
    Injectable()
], LeadsService);
export { LeadsService };
