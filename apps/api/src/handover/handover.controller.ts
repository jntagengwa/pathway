import {
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Req,
  Inject,
  Query,
  Body,
  Param,
} from "@nestjs/common";
import type { Request } from "express";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { HandoverService } from "./handover.service";
import {
  handoverMyNextQueryDto,
  handoverCreateDto,
  handoverUpdateDto,
} from "./dto";
import type { HandoverAuthenticatedRequest } from "./handover.auth";
import { getAuthUserId } from "./handover.auth";

const rawMyNextQuerySchema = handoverMyNextQueryDto;

@Controller("handover")
@UseGuards(AuthUserGuard)
export class HandoverController {
  constructor(
    @Inject(HandoverService) private readonly service: HandoverService,
  ) {}

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: Request & HandoverAuthenticatedRequest,
  ) {
    const parsedBody =
      typeof body === "string"
        ? JSON.parse(body)
        : (body as unknown);
    const dto = await handoverCreateDto.parseAsync(parsedBody);
    const userId = getAuthUserId(req);
    return this.service.createOrUpdateDraft(tenantId, userId, dto);
  }

  @Get("my-next")
  async getMyNext(
    @Query() query: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: Request & HandoverAuthenticatedRequest,
  ) {
    await rawMyNextQuerySchema.parseAsync(query);
    const userId = getAuthUserId(req);
    return this.service.getMyNextHandoverLog({ tenantId, userId });
  }

  @Get("for-session/:sessionId")
  async getForSession(
    @Param("sessionId") sessionId: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const result = await this.service.getHandoverForSession(sessionId, tenantId);
    return result
      ? { handoverLogId: result.id, status: result.status }
      : { handoverLogId: null };
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    return this.service.getByIdForStaff(id, tenantId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: Request & HandoverAuthenticatedRequest,
  ) {
    const dto = await handoverUpdateDto.parseAsync(body);
    const userId = getAuthUserId(req);
    return this.service.updateLog(id, tenantId, userId, dto);
  }
}

