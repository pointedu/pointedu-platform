'use client'

interface ChartData {
  monthlyRequests: { month: string; count: number }[]
  monthlyPayments: { month: string; amount: number }[]
  instructorStats: { name: string; count: number }[]
  programStats: { name: string; count: number }[]
}

export default function DashboardCharts({ data }: { data: ChartData }) {
  const maxRequests = Math.max(...data.monthlyRequests.map((m) => m.count), 1)
  const maxPayments = Math.max(...data.monthlyPayments.map((m) => m.amount), 1)
  const maxInstructor = Math.max(...data.instructorStats.map((i) => i.count), 1)
  const maxProgram = Math.max(...data.programStats.map((p) => p.count), 1)

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Monthly Requests Chart */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 요청 현황</h3>
        <div className="space-y-3">
          {data.monthlyRequests.map((item) => (
            <div key={item.month} className="flex items-center gap-3">
              <span className="w-12 text-sm text-gray-500">{item.month}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((item.count / maxRequests) * 100, 8)}%` }}
                >
                  <span className="text-xs font-medium text-white">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.monthlyRequests.length === 0 && (
          <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
        )}
      </div>

      {/* Monthly Payments Chart */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 정산 현황</h3>
        <div className="space-y-3">
          {data.monthlyPayments.map((item) => (
            <div key={item.month} className="flex items-center gap-3">
              <span className="w-12 text-sm text-gray-500">{item.month}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((item.amount / maxPayments) * 100, 8)}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    {(item.amount / 10000).toFixed(0)}만원
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.monthlyPayments.length === 0 && (
          <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
        )}
      </div>

      {/* Instructor Performance */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">강사별 수업 현황</h3>
        <div className="space-y-3">
          {data.instructorStats.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-6 text-sm font-medium text-gray-400">{index + 1}</span>
              <span className="w-20 text-sm text-gray-700 truncate">{item.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((item.count / maxInstructor) * 100, 8)}%` }}
                >
                  <span className="text-xs font-medium text-white">{item.count}회</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.instructorStats.length === 0 && (
          <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
        )}
      </div>

      {/* Program Distribution */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">프로그램별 요청 현황</h3>
        <div className="space-y-3">
          {data.programStats.slice(0, 5).map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-24 text-sm text-gray-700 truncate">{item.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((item.count / maxProgram) * 100, 8)}%` }}
                >
                  <span className="text-xs font-medium text-white">{item.count}건</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.programStats.length === 0 && (
          <p className="text-center text-gray-500 py-4">데이터가 없습니다</p>
        )}
      </div>
    </div>
  )
}
