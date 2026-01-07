import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ExcelColumn {
  header: string
  key: string
  width?: number
}

interface ExportOptions {
  filename: string
  sheetName?: string
  columns: ExcelColumn[]
  data: Record<string, unknown>[]
}

export function exportToExcel({ filename, sheetName = 'Sheet1', columns, data }: ExportOptions) {
  // 헤더 행 생성
  const headers = columns.map(col => col.header)

  // 데이터 행 생성
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key]
      // 배열인 경우 쉼표로 연결
      if (Array.isArray(value)) return value.join(', ')
      // 날짜인 경우 포맷팅
      if (value instanceof Date) return value.toLocaleDateString('ko-KR')
      // null/undefined 처리
      return value ?? ''
    })
  )

  // 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // 열 너비 설정
  worksheet['!cols'] = columns.map(col => ({ wch: col.width || 15 }))

  // 워크북 생성
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // 파일 생성 및 다운로드
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

  const now = new Date().toISOString().slice(0, 10)
  saveAs(blob, `${filename}_${now}.xlsx`)
}

// 강사 목록 내보내기 설정
export const instructorExcelConfig: ExcelColumn[] = [
  { header: '이름', key: 'name', width: 12 },
  { header: '전화번호', key: 'phoneNumber', width: 15 },
  { header: '이메일', key: 'email', width: 25 },
  { header: '거주지', key: 'homeBase', width: 10 },
  { header: '전문과목', key: 'subjects', width: 25 },
  { header: '활동범위', key: 'rangeKm', width: 12 },
  { header: '가능요일', key: 'availableDays', width: 15 },
  { header: '상태', key: 'statusLabel', width: 10 },
  { header: '배정건수', key: 'assignmentCount', width: 10 },
  { header: '정산건수', key: 'paymentCount', width: 10 },
]

// 학교 요청 목록 내보내기 설정
export const requestExcelConfig: ExcelColumn[] = [
  { header: '학교명', key: 'schoolName', width: 20 },
  { header: '프로그램', key: 'programName', width: 20 },
  { header: '희망일자', key: 'preferredDate', width: 12 },
  { header: '차시', key: 'sessions', width: 8 },
  { header: '학생수', key: 'studentCount', width: 10 },
  { header: '담당자', key: 'contactName', width: 12 },
  { header: '연락처', key: 'contactPhone', width: 15 },
  { header: '상태', key: 'statusLabel', width: 10 },
  { header: '배정강사', key: 'instructorName', width: 12 },
  { header: '등록일', key: 'createdAt', width: 12 },
]

// 정산 목록 내보내기 설정
export const paymentExcelConfig: ExcelColumn[] = [
  { header: '강사명', key: 'instructorName', width: 12 },
  { header: '학교명', key: 'schoolName', width: 20 },
  { header: '프로그램', key: 'programName', width: 20 },
  { header: '수업일', key: 'classDate', width: 12 },
  { header: '차시', key: 'sessions', width: 8 },
  { header: '강사비', key: 'instructorFee', width: 12 },
  { header: '교통비', key: 'transportFee', width: 10 },
  { header: '총액', key: 'totalAmount', width: 12 },
  { header: '실지급액', key: 'netAmount', width: 12 },
  { header: '상태', key: 'statusLabel', width: 10 },
  { header: '지급일', key: 'paidAt', width: 12 },
]

// 학교 목록 내보내기 설정
export const schoolExcelConfig: ExcelColumn[] = [
  { header: '학교명', key: 'name', width: 25 },
  { header: '주소', key: 'address', width: 40 },
  { header: '담당자', key: 'contactName', width: 12 },
  { header: '연락처', key: 'contactPhone', width: 15 },
  { header: '이메일', key: 'contactEmail', width: 25 },
  { header: '요청건수', key: 'requestCount', width: 10 },
]
