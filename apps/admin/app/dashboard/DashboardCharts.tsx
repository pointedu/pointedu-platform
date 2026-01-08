'use client'

import { useState, useTransition, memo, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface ChartData {
  monthlyRequests: { month: string; count: number }[]
  monthlyPayments: { month: string; amount: number }[]
  instructorStats: { name: string; count: number }[]
  programStats: { name: string; count: number }[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { name: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium">{payload[0].payload.name}</p>
        <p className="text-sm text-gray-600">{payload[0].value}건</p>
      </div>
    )
  }
  return null
}

const formatAmount = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`
  }
  return value.toString()
}

// 메모이제이션된 차트 컴포넌트들
const RequestsChart = memo(function RequestsChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3B82F6"
          fill="#93C5FD"
          name="요청 건수"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})

const PaymentsChart = memo(function PaymentsChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAmount} />
        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '정산액']} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#10B981"
          fill="#6EE7B7"
          name="정산액"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})

export default function DashboardCharts({ data }: { data: ChartData }) {
  const [activeTab, setActiveTab] = useState<'requests' | 'payments'>('requests')
  const [isPending, startTransition] = useTransition()

  const handleTabChange = useCallback((tab: 'requests' | 'payments') => {
    startTransition(() => {
      setActiveTab(tab)
    })
  }, [])

  const totalRequests = data.programStats.reduce((sum, item) => sum + item.count, 0)

  const rawPieData = data.programStats.slice(0, 5).map((item, index) => ({
    name: item.name,
    shortName: item.name.length > 8 ? item.name.slice(0, 8) + '...' : item.name,
    value: item.count,
    color: COLORS[index],
  }))

  if (data.programStats.length > 5) {
    const otherCount = data.programStats.slice(5).reduce((sum, item) => sum + item.count, 0)
    if (otherCount > 0) {
      rawPieData.push({
        name: '기타',
        shortName: '기타',
        value: otherCount,
        color: COLORS[5],
      })
    }
  }

  const pieData = rawPieData.filter(item => item.value > 0)

  return (
    <div className="mt-8 space-y-6">
      {/* Monthly Trend Chart with Tabs */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">월별 추이</h3>
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => handleTabChange('requests')}
              disabled={isPending}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'requests'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
            >
              요청
            </button>
            <button
              onClick={() => handleTabChange('payments')}
              disabled={isPending}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'payments'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
            >
              정산
            </button>
          </div>
        </div>
        <div className="h-64 relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          {activeTab === 'requests' ? (
            <RequestsChart data={data.monthlyRequests} />
          ) : (
            <PaymentsChart data={data.monthlyPayments} />
          )}
        </div>
        {((activeTab === 'requests' && data.monthlyRequests.length === 0) ||
          (activeTab === 'payments' && data.monthlyPayments.length === 0)) && (
          <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Instructor Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">강사별 수업 현황</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.instructorStats.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" name="수업 수" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.instructorStats.length === 0 && (
            <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
          )}
        </div>

        {/* Program Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">프로그램별 요청 현황</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="35%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="shortName"
                  label={false}
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value: string, entry: { payload?: { name?: string; value?: number } }) => {
                    const item = entry.payload
                    if (item && totalRequests > 0) {
                      const percent = ((item.value || 0) / totalRequests * 100).toFixed(0)
                      return `${value} (${percent}%)`
                    }
                    return value
                  }}
                  wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {pieData.length === 0 && (
            <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">총 요청</p>
          <p className="text-2xl font-bold">{totalRequests}건</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">총 정산</p>
          <p className="text-2xl font-bold">
            {formatAmount(data.monthlyPayments.reduce((sum, m) => sum + m.amount, 0))}원
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">활동 강사</p>
          <p className="text-2xl font-bold">{data.instructorStats.length}명</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">프로그램 수</p>
          <p className="text-2xl font-bold">{data.programStats.length}개</p>
        </div>
      </div>
    </div>
  )
}
