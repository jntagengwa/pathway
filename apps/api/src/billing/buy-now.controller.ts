import {
  Body,
  Controller,
  Post,
  UseGuards,
  Inject,
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

@UseGuards(AuthUserGuard)
@Controller("billing/buy-now")
export class BuyNowController {
  constructor(@Inject(BuyNowService) private readonly buyNowService: BuyNowService) {}

  @Post("checkout")
  async checkout(
    @Body() body: BuyNowCheckoutRequestDto,
  ): Promise<BuyNowCheckoutResponse> {
    return this.buyNowService.checkout(body);
  }
}

