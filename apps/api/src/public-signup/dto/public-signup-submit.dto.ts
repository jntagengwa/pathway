import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ParentGuardianDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationshipToChild?: string;
}

export class EmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  relationship?: string;
}

export class ChildSignupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  /** Comma or newline separated, or single string; stored as trimmed list. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalNeedsNotes?: string;

  @IsBoolean()
  photoConsent!: boolean;

  /** Base64-encoded image (only accepted when photoConsent is true). Stored as bytes in DB until S3. */
  @IsOptional()
  @IsString()
  photoBase64?: string;

  /** Content type of photoBase64, e.g. image/jpeg. Required if photoBase64 is set. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  photoContentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pickupPermissions?: string;
}

export class ConsentsDto {
  @IsBoolean()
  dataProcessingConsent!: boolean;

  @IsOptional()
  @IsBoolean()
  firstAidConsent?: boolean;
}

export class PublicSignupSubmitDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(128)
  token!: string;

  @ValidateNested()
  @Type(() => ParentGuardianDto)
  parent!: ParentGuardianDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts!: EmergencyContactDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildSignupDto)
  children!: ChildSignupDto[];

  @ValidateNested()
  @Type(() => ConsentsDto)
  consents!: ConsentsDto;
}
