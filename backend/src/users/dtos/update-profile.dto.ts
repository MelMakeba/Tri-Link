export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  dateOfBirth?: Date | string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
}
