import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Inject,
} from "@nestjs/common";
import { PlanPreviewService } from "./plan-preview.service";
import {
  type PlanPreviewRequest,
  type PlanPreviewResponse,
  type PlanPreviewAddons,
} from "./plan-preview.types";

/**
 * Public plan preview endpoint for buy-now flow.
 * No authentication required - plan previews are publicly available.
 */
@Controller("billing/plan-preview")
export class PlanPreviewController {
  constructor(@Inject(PlanPreviewService) private readonly planPreviewService: PlanPreviewService) {}

  @Post()
  preview(@Body() body: PlanPreviewRequest): PlanPreviewResponse {
    const errors: string[] = [];
    const trimmedPlanCode = (body?.planCode ?? "").trim();
    if (!trimmedPlanCode) {
      errors.push("planCode is required");
    }

    const addons = body?.addons;
    if (addons && typeof addons !== "object") {
      errors.push("addons must be an object when provided");
    }

    const validateNumber = (value: unknown, field: keyof PlanPreviewAddons) => {
      if (value === undefined || value === null) return;
      if (typeof value !== "number" || Number.isNaN(value)) {
        errors.push(`${field} must be a number`);
      }
    };

    if (addons && typeof addons === "object") {
      validateNumber(addons.extraAv30Blocks, "extraAv30Blocks");
      validateNumber(addons.extraStorageGb, "extraStorageGb");
      validateNumber(addons.extraSmsMessages, "extraSmsMessages");
      validateNumber(addons.extraLeaderSeats, "extraLeaderSeats");
      validateNumber(addons.extraSites, "extraSites");
    }

    if (errors.length) {
      throw new BadRequestException({
        error: "Invalid plan preview request",
        details: errors,
      });
    }

    return this.planPreviewService.preview({
      planCode: trimmedPlanCode,
      addons: body?.addons,
    });
  }
}

