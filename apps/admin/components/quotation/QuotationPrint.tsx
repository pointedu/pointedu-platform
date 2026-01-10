'use client'

import { forwardRef } from 'react'
import { formatNumber, numberToKorean } from '../../lib/numberToKorean'
import type { QuotationFormData } from './QuotationForm'

interface QuotationPrintProps {
  data: QuotationFormData
  stampImageUrl?: string
}

const QuotationPrint = forwardRef<HTMLDivElement, QuotationPrintProps>(
  ({ data, stampImageUrl }, ref) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    }

    return (
      <div
        ref={ref}
        className="quotation-print bg-white"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 20mm',
          margin: '0 auto',
          fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
          fontSize: '10pt',
          lineHeight: '1.4',
          color: '#000',
        }}
      >
        {/* 일련번호 */}
        <div style={{ textAlign: 'right', marginBottom: '10mm', fontSize: '9pt', color: '#666' }}>
          일련번호 : {data.quotationNumber}
        </div>

        {/* 제목 */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '24pt',
            fontWeight: 'bold',
            marginBottom: '15mm',
            letterSpacing: '8px',
          }}
        >
          견 적 서
        </h1>

        {/* 수신자 정보 */}
        <div style={{ marginBottom: '8mm' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '80px', padding: '3px 0', fontWeight: 'bold' }}>기 관 명</td>
                <td style={{ borderBottom: '1px solid #000', padding: '3px 0' }}>
                  {data.clientName}
                </td>
                <td style={{ width: '60px', textAlign: 'right', padding: '3px 10px' }}>귀하</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 공급자 정보 테이블 */}
        <div style={{ marginBottom: '8mm' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '2px solid #000',
            }}
          >
            <tbody>
              <tr>
                <td
                  rowSpan={5}
                  style={{
                    width: '80px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    borderRight: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    writingMode: 'vertical-rl',
                    letterSpacing: '8px',
                  }}
                >
                  공급자
                </td>
                <td
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  등록번호
                </td>
                <td
                  colSpan={3}
                  style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid #000',
                    letterSpacing: '2px',
                  }}
                >
                  513-88-01734
                </td>
                <td
                  rowSpan={5}
                  style={{
                    width: '80px',
                    textAlign: 'center',
                    padding: '10px',
                    position: 'relative',
                  }}
                >
                  {stampImageUrl && (
                    <img
                      src={stampImageUrl}
                      alt="직인"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  상 호
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                  }}
                >
                  포인트교육주식회사
                </td>
                <td
                  style={{
                    width: '60px',
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  대표자
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #000' }}>유현종</td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  소재지
                </td>
                <td
                  colSpan={3}
                  style={{ padding: '6px 10px', borderBottom: '1px solid #000', fontSize: '9pt' }}
                >
                  경상북도 영주시 번영로 18-1, 302호 (휴천동, 영주팔레스)
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  업 태
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                  }}
                >
                  서비스
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    borderBottom: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  종 목
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #000' }}>교육서비스</td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  연락처
                </td>
                <td style={{ padding: '6px 10px', borderRight: '1px solid #000' }}>
                  054-635-6130
                </td>
                <td
                  style={{
                    padding: '6px 10px',
                    borderRight: '1px solid #000',
                    backgroundColor: '#f8f8f8',
                    fontWeight: 'bold',
                  }}
                >
                  팩 스
                </td>
                <td style={{ padding: '6px 10px' }}>0504-035-6130</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 금액 */}
        <div
          style={{
            marginBottom: '8mm',
            border: '2px solid #000',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
            금액 : {numberToKorean(data.totalAmount)}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '14pt', color: '#1a56db' }}>
            ₩{formatNumber(data.totalAmount)}원
          </div>
        </div>

        {/* 품목 테이블 */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '2px solid #000',
            marginBottom: '8mm',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '8px 5px',
                  fontWeight: 'bold',
                  width: '60px',
                }}
              >
                품목코드
              </th>
              <th style={{ border: '1px solid #000', padding: '8px 5px', fontWeight: 'bold' }}>
                품목명(규격)
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '8px 5px',
                  fontWeight: 'bold',
                  width: '70px',
                }}
              >
                수량(인원/반)
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '8px 5px',
                  fontWeight: 'bold',
                  width: '80px',
                }}
              >
                단가
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '8px 5px',
                  fontWeight: 'bold',
                  width: '100px',
                }}
              >
                공급가액
              </th>
              <th
                style={{
                  border: '1px solid #000',
                  padding: '8px 5px',
                  fontWeight: 'bold',
                  width: '60px',
                }}
              >
                비고
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: '1px solid #000', padding: '6px 5px', textAlign: 'center' }}>
                  {item.itemCode || '-'}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                  {item.itemName}
                  {item.specification && ` (${item.specification})`}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 5px', textAlign: 'center' }}>
                  {item.quantity}
                  {item.unit}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 5px', textAlign: 'right' }}>
                  {formatNumber(item.unitPrice)}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 5px', textAlign: 'right' }}>
                  {formatNumber(item.supplyAmount)}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 5px', textAlign: 'center' }}>
                  {item.remark || '-'}
                </td>
              </tr>
            ))}
            {/* 빈 행 추가 (최소 10행 유지) */}
            {Array.from({ length: Math.max(0, 8 - data.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ border: '1px solid #000', padding: '6px 5px', height: '24px' }}>
                  &nbsp;
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '6px 5px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '6px 5px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '6px 5px' }}>&nbsp;</td>
                <td style={{ border: '1px solid #000', padding: '6px 5px' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8f8f8' }}>
              <td
                colSpan={4}
                style={{
                  border: '1px solid #000',
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                합 계
              </td>
              <td
                style={{
                  border: '1px solid #000',
                  padding: '8px 5px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {formatNumber(data.totalSupplyAmount)}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 5px' }}></td>
            </tr>
          </tfoot>
        </table>

        {/* 비고 */}
        {data.notes && (
          <div style={{ marginBottom: '10mm' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>비고:</div>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                backgroundColor: '#fafafa',
                whiteSpace: 'pre-wrap',
              }}
            >
              {data.notes}
            </div>
          </div>
        )}

        {/* 발행일 */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '15mm',
            fontSize: '11pt',
          }}
        >
          {formatDate(data.issueDate)}
        </div>

        {/* 스타일 - 인쇄용 */}
        <style jsx global>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .quotation-print {
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 15mm 20mm !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>
      </div>
    )
  }
)

QuotationPrint.displayName = 'QuotationPrint'

export default QuotationPrint
