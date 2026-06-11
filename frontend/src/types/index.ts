export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CAJERO: 'CAJERO',
} as const;

export type Role = typeof Role[keyof typeof Role];
  
  export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
  }
  
  export interface AuthResponse {
    accessToken: string;
    user: User;
  }
  
  export interface Category {
    id: number;
    name: string;
    breakfastCost: number;
    lunchCost: number;
  }
  
  export interface Employee {
    id: number;
    employeeCode: string;
    name: string;
    cedula: string;
    department: string;
    payrollType: 'SEMANAL' | 'QUINCENAL';
    categoryId: number;
    category: Category;
    active: boolean;
  }
  
  export interface Record {
    id: number;
    employeeId: number;
    mealType: 'DESAYUNO' | 'ALMUERZO';
    amount: number;
    createdAt: string;
  }
  
  export interface Schedule {
    id: number;
    mealType: 'DESAYUNO' | 'ALMUERZO';
    startTime: string;
    endTime: string;
  }