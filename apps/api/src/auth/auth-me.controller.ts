import { Controller, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthUserGuard } from "./auth-user.guard";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

/**
 * Returns the current user id from the auth token.
 * Used by the admin app when session.user.id is missing (e.g. after sign-in before identity upsert).
 */
@Controller("auth")
@UseGuards(AuthUserGuard)
export class AuthMeController {
  @Get("me")
  getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.authUserId;
    if (!userId) {
      throw new UnauthorizedException("Missing authenticated user");
    }
    return { userId };
  }
}
