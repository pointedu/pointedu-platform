// 로깅 유틸리티
// Logger Utility

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, data?: unknown) => {
    if (isDev) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ?? '')
    }
  },

  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ?? '')
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ?? '')
  },

  debug: (message: string, data?: unknown) => {
    if (isDev) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ?? '')
    }
  },
}

export default logger
