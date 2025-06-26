/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
