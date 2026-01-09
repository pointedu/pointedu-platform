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

// 엑셀 파일을 JSON으로 파싱
export function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData as Record<string, unknown>[])
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}

// 엑셀 템플릿 다운로드
export function downloadExcelTemplate(
  filename: string,
  columns: { header: string; key: string; example?: string; width?: number }[],
  sheetName = 'Sheet1'
) {
  // 헤더 행
  const headers = columns.map((col) => col.header)
  // 예시 행
  const exampleRow = columns.map((col) => col.example || '')

  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow])

  // 열 너비 설정
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width || 15 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  saveAs(blob, `${filename}_양식.xlsx`)
}

// 학교 수업요청 엑셀 템플릿 설정
export const requestExcelTemplateConfig = [
  { header: '학교명', key: 'schoolName', example: '영주초등학교', width: 20 },
  { header: '프로그램명', key: 'programName', example: 'AI 코딩 체험', width: 20 },
  { header: '차시', key: 'sessions', example: '2', width: 8 },
  { header: '학생수', key: 'studentCount', example: '25', width: 10 },
  { header: '대상학년', key: 'targetGrade', example: '중2', width: 10 },
  { header: '희망날짜', key: 'desiredDate', example: '2025-03-15', width: 15 },
  { header: '예산', key: 'budget', example: '200000', width: 12 },
  { header: '요청사항', key: 'requirements', example: '오전 수업 희망', width: 25 },
]

// 프로그램 엑셀 템플릿 설정
export const programExcelTemplateConfig = [
  { header: '프로그램명', key: 'name', example: 'AI 로봇 코딩', width: 25 },
  { header: '카테고리', key: 'category', example: 'FOURTHIND', width: 12 },
  { header: '설명', key: 'description', example: 'AI 기반 로봇 프로그래밍 체험', width: 40 },
  { header: '수업시간(분)', key: 'sessionMinutes', example: '45', width: 12 },
  { header: '최대학생수', key: 'maxStudents', example: '30', width: 12 },
  { header: '기본가격', key: 'baseSessionFee', example: '50000', width: 12 },
]

// 카테고리 매핑 (한글 → DB enum)
export const categoryMapping: Record<string, string> = {
  '진로체험': 'CAREER',
  '진로탐색': 'CAREER',
  'AI/코딩': 'FOURTHIND',
  'AI코딩': 'FOURTHIND',
  '4차산업': 'FOURTHIND',
  '메이커': 'STEAM',
  '과학실험': 'STEAM',
  '과학': 'STEAM',
  'STEAM': 'STEAM',
  '예술/창작': 'CULTURE',
  '예술': 'CULTURE',
  '창작': 'CULTURE',
  '문화예술': 'CULTURE',
  '체험형': 'EXPERIENCE',
  '체험': 'EXPERIENCE',
  '전문직': 'PROFESSIONAL',
  '메디컬': 'MEDICAL',
  '기타': 'OTHER',
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
