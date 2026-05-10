// ─────────────────────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────────────────────

// Enum instead of plain strings — TypeScript will catch
// typos like 'requester' or 'REQUESTER' at compile time
export enum UserRole {
  REQUESTER = 'Requester',
  VALIDATOR = 'Validator',
}

// Shape of a user object returned from the API
// Both portals and the backend import this same interface —
// if we ever add a field, TypeScript flags every place that needs updating
export interface User {
  id: string;
  name: string
  email: string
  role: UserRole
}

// ─────────────────────────────────────────────────────────────
// VACATION REQUEST TYPES
// ─────────────────────────────────────────────────────────────

// All valid request statuses
// Pending is the only status a requester can create
// Approved and Rejected can only be set by a validator
export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

// Full shape of a vacation request as stored in the DB
// and returned by the API — used in both portals
export interface VacationRequest {
  id: string;
  user: User
  startDate: string        // stored as 'YYYY-MM-DD' string
  endDate: string          // stored as 'YYYY-MM-DD' string
  reason: string | null    // optional — null when not provided
  status: RequestStatus
  comments: string | null  // only set when status is Rejected
  createdAt: string        // ISO date string from the DB
}

// ─────────────────────────────────────────────────────────────
// DATA TRANSFER OBJECTS (DTOs)
// DTOs are the shapes of data sent TO the API
// Separate from the full entity because you never send
// the whole object — only the fields the API needs
// ─────────────────────────────────────────────────────────────

// Body sent when submitting a new vacation request
// reason is optional — the ? means it can be undefined
export interface CreateRequestDto {
  userId: number
  startDate: string
  endDate: string
  reason?: string
}

// Body sent when approving or rejecting a request
// status is limited to only Approved or Rejected —
// a validator cannot set a request back to Pending
// comments is required when rejecting, optional when approving
export interface UpdateRequestDto {
  status: RequestStatus.APPROVED | RequestStatus.REJECTED
  comments?: string
}

// ─────────────────────────────────────────────────────────────
// API RESPONSE WRAPPERS
// Every API response uses the same envelope shape
// so the frontend always knows exactly what to expect
// ─────────────────────────────────────────────────────────────

// T is a generic — it can be any type
// ApiResponse<VacationRequest> means data is a single request
// ApiResponse<VacationRequest[]> means data is an array of requests
export interface ApiResponse<T> {
  data: T
  total?: number  // only included on list responses
}

// Every error response has this exact shape
// code is machine-readable e.g. 'DATE_CONFLICT'
// message is human-readable e.g. 'Overlaps with Jul 1–5'
// field is optional — only set when error relates to a specific form field
export interface ApiError {
  error: {
    code: string
    message: string
    field?: string
  }
}