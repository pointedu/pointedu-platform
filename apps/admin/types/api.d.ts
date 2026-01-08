// API Response Types
export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// School Types
export interface School {
  id: string
  name: string
  type: string
  address: string
  distanceKm: number | null
  region: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Instructor Types
export interface Instructor {
  id: string
  userId: string
  name: string
  phone: string
  email: string
  specialties: string[]
  career: string | null
  education: string | null
  bank: string | null
  accountNumber: string | null
  accountHolder: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Program Types
export interface Program {
  id: string
  name: string
  category: string
  description: string | null
  targetGrades: string[]
  minStudents: number
  maxStudents: number
  duration: number
  baseFee: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// School Request Types
export interface SchoolRequest {
  id: string
  requestNumber: string
  schoolId: string
  programId: string | null
  customProgram: string | null
  sessions: number
  studentCount: number
  targetGrade: string
  desiredDate: Date | null
  preferredDates: string[]
  requirements: string | null
  status: RequestStatus
  createdAt: Date
  updatedAt: Date
  school?: School
  program?: Program | null
  assignments?: InstructorAssignment[]
}

export type RequestStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'

// Instructor Assignment Types
export interface InstructorAssignment {
  id: string
  requestId: string
  instructorId: string
  status: AssignmentStatus
  scheduledDate: Date | null
  scheduledTime: string | null
  distanceKm: number
  transportFee: number
  instructorFee: number | null
  createdAt: Date
  updatedAt: Date
  instructor?: Instructor
  request?: SchoolRequest
}

export type AssignmentStatus =
  | 'PROPOSED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

// Settlement Types
export interface Settlement {
  id: string
  instructorId: string
  yearMonth: string
  totalClasses: number
  totalStudents: number
  totalFee: number
  totalTransportFee: number
  totalAmount: number
  taxAmount: number
  netAmount: number
  status: SettlementStatus
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
  instructor?: Instructor
}

export type SettlementStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'

// User Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INSTRUCTOR'
  | 'VIEWER'

// Settings Types
export interface Setting {
  id: string
  key: string
  value: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

// Form Data Types
export interface SchoolFormData {
  name: string
  type: string
  address: string
  distanceKm: number | null
  region: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
}

export interface InstructorFormData {
  name: string
  phone: string
  email: string
  specialties: string[]
  career: string | null
  education: string | null
  bank: string | null
  accountNumber: string | null
  accountHolder: string | null
}

export interface RequestFormData {
  schoolId: string
  programId: string | null
  customProgram: string | null
  sessions: number
  studentCount: number
  targetGrade: string
  desiredDate: string | null
  preferredDates: string[]
  requirements: string | null
}

// Bulk Request Types
export interface BulkRequestItem {
  programId: string | null
  customProgram: string | null
  instructorId: string | null
  sessions: number
  studentCount: number
  targetGrade: string
  scheduledTime: string
  note: string
}

export interface BulkRequestPayload {
  schoolId: string
  scheduledDate: string
  items: BulkRequestItem[]
}
