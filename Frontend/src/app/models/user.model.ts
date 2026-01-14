export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
