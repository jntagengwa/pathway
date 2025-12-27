import { IsEmail, IsEnum, IsOptional, IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OrgRole, SiteRole } from "@pathway/db";

class SiteAccessDto {
  @IsEnum(["ALL_SITES", "SELECT_SITES"])
  mode!: "ALL_SITES" | "SELECT_SITES";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siteIds?: string[];

  @IsEnum(SiteRole)
  role!: SiteRole;
}

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(OrgRole)
  orgRole?: OrgRole;

  @IsOptional()
  @ValidateNested()
  @Type(() => SiteAccessDto)
  siteAccess?: SiteAccessDto;
}

