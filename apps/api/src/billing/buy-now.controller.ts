import {
  Body,
  Controller,
  Post,
  Inject,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsUrl,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { BuyNowService } from "./buy-now.service";
import type {
  BuyNowCheckoutResponse,
  BuyNowOrgDetails,
  BuyNowPlanSelection,
  OrgPurchaseRequest,
} from "./buy-now.types";

class BuyNowPlanSelectionDto implements BuyNowPlanSelection {
  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  av30AddonBlocks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extraSites?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extraStorageGb?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extraSmsMessages?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extraLeaderSeats?: number;
}

class BuyNowOrgDetailsDto implements BuyNowOrgDetails {
  @IsString()
  @IsNotEmpty()
  orgName!: string;

  @IsString()
  @IsNotEmpty()
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  source?: string;
}

class BuyNowCheckoutRequestDto {
  @ValidateNested()
  @Type(() => BuyNowPlanSelectionDto)
  plan!: BuyNowPlanSelectionDto;

  @ValidateNested()
  @Type(() => BuyNowOrgDetailsDto)
  org!: BuyNowOrgDetailsDto;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl()
  successUrl?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl()
  cancelUrl?: string;
}

class OrgPurchaseRequestDto implements OrgPurchaseRequest {
  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl()
  successUrl?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUrl()
  cancelUrl?: string;
}

/**
 * Public buy-now checkout endpoint.
 * No authentication required - this is for new customers purchasing for the first time.
 */
@Controller("billing/buy-now")
export class BuyNowController {
  constructor(@Inject(BuyNowService) private readonly buyNowService: BuyNowService) {}

  @Post("checkout")
  async checkout(
    @Body() body: BuyNowCheckoutRequestDto,
  ): Promise<BuyNowCheckoutResponse> {
    return this.buyNowService.checkout(body);
  }

  /**
   * Authenticated purchase endpoint for existing organisation admins.
   * Requires authentication and org admin role.
   * Prevents duplicate subscriptions and enforces upgrade-only logic.
   */
  @Post("purchase")
  @UseGuards(AuthUserGuard)
  async purchase(
    @Body() body: OrgPurchaseRequestDto,
  ): Promise<BuyNowCheckoutResponse> {
    if (!this.buyNowService["requestContext"]?.currentOrgId) {
      throw new ForbiddenException("Organisation context required");
    }
    return this.buyNowService.purchaseForOrg(body);
  }
}

