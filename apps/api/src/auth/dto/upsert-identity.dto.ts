import { IsOptional, IsString } from "class-validator";

export class UpsertIdentityDto {
  @IsString()
  provider!: string;

  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}


