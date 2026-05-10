// ─────────────────────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────────────────────

export enum UserRole {
  REQUESTER = 'Requester',
  VALIDATOR = 'Validator',
}

export interface User {
  id: string;
  name: string
  email: string
  role: UserRole
}

// ─────────────────────────────────────────────────────────────
// VACATION REQUEST TYPES
// ─────────────────────────────────────────────────────────────

// Pending is the only status a requester can create
// Approved and Rejected can only be set by a validator
export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface VacationRequest {
  id: string;
  user: User
  startDate: string        // stored as 'YYYY-MM-DD' string
  endDate: string          // stored as 'YYYY-MM-DD' string
  reason: string | null
  status: RequestStatus
  comments: string | null  // only set when status is Rejected
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// DATA TRANSFER OBJECTS (DTOs)
// ─────────────────────────────────────────────────────────────

export interface CreateRequestDto {
  userId: number
  startDate: string
  endDate: string
  reason?: string
}

// a validator cannot set a request back to Pending
export interface UpdateRequestDto {
  status: RequestStatus.APPROVED | RequestStatus.REJECTED
  comments?: string
}

// ─────────────────────────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  total?: number  // only included on list responses
}

export interface ApiError {
  error: {
    code: string
    message: string
    field?: string
  }
}
