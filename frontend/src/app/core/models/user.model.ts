export enum UserRole {
    ADMIN = 'ADMIN',
    AGENT = 'AGENT',
    CUSTOMER = 'CUSTOMER'
  }
  
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    emailVerified: boolean; // Added for email verification
    avatar?: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    isActive: boolean;
    emailNotifications?: boolean; // New field for email notification preference
    smsNotifications?: boolean; // New field for SMS notification preference
    marketingUpdates?: boolean; // New field for marketing updates preference
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole; // Optional, might be set by admin
  }
  
  export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }
  
  // Additional types for better type safety
  export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profilePicture?: string;
    emailVerified: boolean;
  }
  
  export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
  
  export interface ProfileUpdateRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }