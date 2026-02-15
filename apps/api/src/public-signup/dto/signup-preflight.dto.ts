import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class SignupPreflightDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(128)
  inviteToken!: string;

  @IsEmail()
  email!: string;
}
