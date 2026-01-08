'use client'

import { useState } from 'react'
import {
  Cog6ToothIcon,
  UserGroupIcon,
  BellAlertIcon,
  PaperAirplaneIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'

interface SettingsLayoutProps {
  sections: {
    general: React.ReactNode
    instructorRules: React.ReactNode
    notificationTest: React.ReactNode
    instructorNotification: React.ReactNode
    backup: React.ReactNode
  }
}

const tabs = [
  { id: 'general', name: '일반 설정', icon: Cog6ToothIcon },
  { id: 'instructorRules', name: '강사 규정', icon: UserGroupIcon },
  { id: 'notificationTest', name: '알림 테스트', icon: BellAlertIcon },
  { id: 'instructorNotification', name: '강사 알림', icon: PaperAirplaneIcon },
  { id: 'backup', name: '백업 관리', icon: CircleStackIcon },
]

export default function SettingsLayout({ sections }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="mt-2 text-sm text-gray-600">
          시스템 설정을 관리합니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'general' && sections.general}
        {activeTab === 'instructorRules' && sections.instructorRules}
        {activeTab === 'notificationTest' && sections.notificationTest}
        {activeTab === 'instructorNotification' && sections.instructorNotification}
        {activeTab === 'backup' && sections.backup}
      </div>
    </div>
  )
}
