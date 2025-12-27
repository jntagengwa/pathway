import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { LeadKind } from "@prisma/client";
import {
  type CreateDemoLeadDto,
  type CreateToolkitLeadDto,
  type CreateTrialLeadDto,
} from "./dto/create-lead.dto";

@Injectable()
export class LeadsService {
  /**
   * Idempotency window: if a lead with the same email+kind was created
   * within this window, we update the existing record instead of creating a new one.
   */
  private readonly IDEMPOTENCY_WINDOW_HOURS = 2;

  private async findRecentLead(
    email: string,
    kind: LeadKind,
  ): Promise<{ id: string } | null> {
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

  async createDemoLead(dto: CreateDemoLeadDto) {
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

  async createToolkitLead(dto: CreateToolkitLeadDto) {
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

  async createTrialLead(dto: CreateTrialLeadDto) {
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
}

