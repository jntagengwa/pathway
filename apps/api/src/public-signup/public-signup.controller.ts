import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nestjs/common";
import { PublicSignupService } from "./public-signup.service";
import { PublicSignupConfigDto } from "./dto/public-signup-config.dto";
import { PublicSignupSubmitDto } from "./dto/public-signup-submit.dto";

/**
 * Public (unauthenticated) endpoints for invite-only parent signup.
 * All routes validate a token from the QR/signup link; tenant is derived server-side.
 * Child photos are sent as base64 in the submit payload and stored as bytes in DB for now.
 */
@Controller("public")
export class PublicSignupController {
  constructor(private readonly publicSignupService: PublicSignupService) {}

  @Get("signup/config")
  async getConfig(
    @Query("token") token: string | undefined,
  ): Promise<PublicSignupConfigDto> {
    if (!token?.trim()) {
      throw new BadRequestException("Token is required");
    }
    return this.publicSignupService.getConfig(token.trim());
  }

  @Post("signup/submit")
  async submit(@Body() body: PublicSignupSubmitDto): Promise<{ success: true; message: string }> {
    return this.publicSignupService.submit(body);
  }
}
