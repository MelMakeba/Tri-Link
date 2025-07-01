import { UserRole } from '../../../generated/prisma';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  avatar?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt: Date;
  updatedAt: Date;
  verificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}
