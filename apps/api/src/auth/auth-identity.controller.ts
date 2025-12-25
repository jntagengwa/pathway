import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { AuthIdentityService } from "./auth-identity.service";
import { UpsertIdentityDto } from "./dto/upsert-identity.dto";

const INTERNAL_SECRET_HEADER = "x-pathway-internal-secret";

@Controller("internal/auth/identity")
export class AuthIdentityController {
  constructor(
    @Inject(AuthIdentityService)
    private readonly authIdentityService: AuthIdentityService,
  ) {}

  @Post("upsert")
  async upsertIdentity(
    @Body() body: UpsertIdentityDto,
    @Headers(INTERNAL_SECRET_HEADER) providedSecret?: string,
  ) {
    const expectedSecret = process.env.INTERNAL_AUTH_SECRET;
    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException("Invalid internal auth secret");
    }

    const result = await this.authIdentityService.upsertFromAuth0(body);
    return result;
  }
}


