// Analytics Service for Point Education Platform
// Provides data aggregation and reporting functions

export interface DateRange {
  start: Date
  end: Date
}

export interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  completedRequests: number
  totalInstructors: number
  activeInstructors: number
  totalPayments: number
  paidPayments: number
  totalRevenue: number
}

export interface MonthlyStats {
  month: string
  requests: number
  completedRequests: number
  revenue: number
  newInstructors: number
}

export interface InstructorPerformance {
  instructorId: string
  name: string
  totalClasses: number
  completionRate: number
  averageRating: number
  totalEarnings: number
}

export interface ProgramPopularity {
  programId: string
  name: string
  category: string
  requestCount: number
  completionCount: number
  satisfactionRate: number
}

// Analytics calculation functions
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return (completed / total) * 100
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getDateRange(period: 'week' | 'month' | 'quarter' | 'year'): DateRange {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7)
      break
    case 'month':
      start.setMonth(end.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(end.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(end.getFullYear() - 1)
      break
  }

  return { start, end }
}

// Aggregation helpers
export function groupByMonth<T extends { createdAt: Date }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()

  items.forEach((item) => {
    const key = getMonthKey(new Date(item.createdAt))
    const existing = grouped.get(key) || []
    grouped.set(key, [...existing, item])
  })

  return grouped
}

export function sumBy<T>(items: T[], key: keyof T): number {
  return items.reduce((sum, item) => {
    const value = item[key]
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)
}

export function averageBy<T>(items: T[], key: keyof T): number {
  if (items.length === 0) return 0
  return sumBy(items, key) / items.length
}

// Report generation helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

// Export analytics types and functions
export const analyticsService = {
  calculateGrowthRate,
  calculateCompletionRate,
  getMonthKey,
  getDateRange,
  groupByMonth,
  sumBy,
  averageBy,
  formatCurrency,
  formatPercentage,
  formatNumber,
}

console.log('Analytics service module loaded')
