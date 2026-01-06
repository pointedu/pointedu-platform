import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StatsCardProps {
  name: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
}

export default function StatsCard({
  name,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'blue',
}: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${colorClasses[color]} p-3`}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">
                {name}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {value}
              </dd>
              {(change !== undefined || changeLabel) && (
                <dd className="mt-1 flex items-center text-sm">
                  {change !== undefined && (
                    <>
                      {change >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`ml-1 ${
                          change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Math.abs(change)}%
                      </span>
                    </>
                  )}
                  {changeLabel && (
                    <span className="ml-2 text-gray-500">{changeLabel}</span>
                  )}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
