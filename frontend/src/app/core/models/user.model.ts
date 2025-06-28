export interface User {
    id: string;
    email:string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    isEmailVerifie:boolean;
    createdAt: Date;
    updatedAt:Date;
}
export enum UserRole {
    ADMIN = 'ADMIN',
    AGENT = 'AGENT',
    CUSTOMER = 'CUSTOMER'
}
export interface LoginRequest {
    email:string;
    password:string;
}

export interface RegisterRequest {
    email:string;
    password:string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}