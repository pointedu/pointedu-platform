import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image
} from '@react-pdf/renderer'
import path from 'path'

// 한글 폰트 경로 설정 (서버 사이드에서 절대 경로 사용)
const fontPath = path.join(process.cwd(), 'public', 'fonts')

// 한글 폰트 등록
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: path.join(fontPath, 'NotoSansKR-Regular.ttf'),
      fontWeight: 'normal'
    },
    {
      src: path.join(fontPath, 'NotoSansKR-Bold.ttf'),
      fontWeight: 'bold'
    }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansKR',
    fontSize: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: 1,
    borderBottomColor: '#000',
    paddingBottom: 20
  },
  logo: {
    width: 100,
    height: 40
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666'
  },
  quoteNumber: {
    fontSize: 10,
    textAlign: 'right',
    color: '#333'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6
  },
  labelCell: {
    width: '30%',
    backgroundColor: '#f9f9f9',
    padding: 6
  },
  valueCell: {
    width: '70%',
    padding: 6
  },
  table: {
    marginTop: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#fff'
  },
  tableHeaderCell: {
    padding: 8,
    fontWeight: 'bold',
    color: '#fff'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#eee'
  },
  tableCell: {
    padding: 8
  },
  col1: { width: '10%' },
  col2: { width: '40%' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  totalSection: {
    marginTop: 20,
    borderTop: 2,
    borderTopColor: '#2563eb',
    paddingTop: 10
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4
  },
  totalLabel: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 10
  },
  totalValue: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold'
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center'
  },
  companyInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  },
  stamp: {
    position: 'absolute',
    right: 60,
    bottom: 100,
    width: 80,
    height: 80,
    opacity: 0.8
  },
  validUntil: {
    marginTop: 10,
    fontSize: 10,
    color: '#666'
  },
  amountInWords: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#2563eb'
  }
})

interface QuoteItem {
  name: string
  quantity: number
  unitPrice: number
  amount: number
}

interface QuoteData {
  quoteNumber: string
  createdAt: string
  validUntil: string
  school: {
    name: string
    address: string
    contactPerson?: string
    phoneNumber?: string
  }
  program: {
    name: string
    sessions: number
    sessionMinutes: number
    studentCount: number
  }
  items: QuoteItem[]
  subtotal: number
  vat: number
  total: number
  notes?: string
}

// 숫자를 한글 금액으로 변환
function numberToKorean(num: number): string {
  const units = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
  const bigUnits = ['', '만', '억', '조']
  const smallUnits = ['', '십', '백', '천']

  if (num === 0) return '영'

  let result = ''
  let unitIndex = 0
  let numStr = String(num)

  while (numStr.length > 0) {
    const chunk = numStr.slice(-4)
    numStr = numStr.slice(0, -4)

    let chunkResult = ''
    for (let i = 0; i < chunk.length; i++) {
      const digit = parseInt(chunk[chunk.length - 1 - i])
      if (digit !== 0) {
        chunkResult = units[digit] + smallUnits[i] + chunkResult
      }
    }

    if (chunkResult) {
      result = chunkResult + bigUnits[unitIndex] + result
    }
    unitIndex++
  }

  return result + '원정'
}

export default function QuotePDF({ data }: { data: QuoteData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Image style={styles.logo} src={path.join(process.cwd(), 'public', 'images', 'pointedu-logo.png')} />
          <View>
            <Text style={styles.title}>견 적 서</Text>
            <Text style={styles.subtitle}>QUOTATION</Text>
          </View>
          <View>
            <Text style={styles.quoteNumber}>견적번호: {data.quoteNumber}</Text>
            <Text style={styles.quoteNumber}>발행일자: {data.createdAt}</Text>
          </View>
        </View>

        {/* 수신자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수 신</Text>
          <View style={styles.row}>
            <Text style={styles.labelCell}>기관명</Text>
            <Text style={styles.valueCell}>{data.school.name} 귀중</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>주소</Text>
            <Text style={styles.valueCell}>{data.school.address}</Text>
          </View>
          {data.school.contactPerson && (
            <View style={styles.row}>
              <Text style={styles.labelCell}>담당자</Text>
              <Text style={styles.valueCell}>{data.school.contactPerson}</Text>
            </View>
          )}
          {data.school.phoneNumber && (
            <View style={styles.row}>
              <Text style={styles.labelCell}>연락처</Text>
              <Text style={styles.valueCell}>{data.school.phoneNumber}</Text>
            </View>
          )}
        </View>

        {/* 프로그램 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>교육 프로그램</Text>
          <View style={styles.row}>
            <Text style={styles.labelCell}>프로그램명</Text>
            <Text style={styles.valueCell}>{data.program.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>교육시간</Text>
            <Text style={styles.valueCell}>
              {data.program.sessions}회 x {data.program.sessionMinutes}분
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>참여인원</Text>
            <Text style={styles.valueCell}>{data.program.studentCount}명</Text>
          </View>
        </View>

        {/* 견적 내역 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>견적 내역</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>No</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>항목</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>수량</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>단가</Text>
              <Text style={[styles.tableHeaderCell, styles.col5]}>금액</Text>
            </View>
            {data.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {item.unitPrice.toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, styles.col5]}>
                  {item.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 합계 */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>공급가액</Text>
            <Text style={styles.totalValue}>{data.subtotal.toLocaleString()}원</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>부가세(10%)</Text>
            <Text style={styles.totalValue}>{data.vat.toLocaleString()}원</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>총 합계</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {data.total.toLocaleString()}원
            </Text>
          </View>
          <Text style={styles.amountInWords}>
            금 {numberToKorean(data.total)}
          </Text>
        </View>

        {/* 유효기간 */}
        <Text style={styles.validUntil}>
          * 본 견적서의 유효기간: {data.validUntil}까지
        </Text>

        {/* 비고 */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>비고</Text>
            <Text style={{ padding: 10 }}>{data.notes}</Text>
          </View>
        )}

        {/* 회사 정보 */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>주식회사 포인트교육</Text>
          <Text>사업자등록번호: 206-87-01535</Text>
          <Text>대표이사: 유광현</Text>
          <Text>주소: 경북 영주시 가흥로 118 2층</Text>
          <Text>Tel: 054-635-9533 / Fax: 054-635-9536</Text>
          <Text>Email: pointedu@pointedu.co.kr</Text>
        </View>

        {/* 직인 이미지 (선택) */}
        {/* <Image style={styles.stamp} src="/images/company-stamp.png" /> */}

        {/* 푸터 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            상기 견적 금액으로 귀 기관의 교육을 진행해 드릴 것을 약속드립니다.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
