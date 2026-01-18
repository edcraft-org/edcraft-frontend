// Common types shared across the application

// Base entity type that all backend models inherit from
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User type
export interface User extends BaseEntity {
  email: string;
  username: string;
}

// API Error type
export interface ApiError {
  detail: string;
  error_type: string;
  status_code: number;
}

// Generic API response wrapper for list endpoints
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Request types for user operations
export interface CreateUserRequest {
  email: string;
  username: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
}
