export const revalidate = 180 // Revalidate every 3 minutes

import { prisma } from '@pointedu/database'
import SettingsForm from './SettingsForm'
import BackupManager from './BackupManager'
import InstructorRulesSettings from './InstructorRulesSettings'
import NotificationTest from './NotificationTest'
import InstructorNotification from './InstructorNotification'

async function getSettings() {
  try {
    const settings = await prisma.setting.findMany()
    return settings.map(s => ({ key: s.key, value: s.value }))
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return []
  }
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="mt-2 text-sm text-gray-600">
          시스템 설정을 관리합니다.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />

      {/* 강사 등급 및 강사비 규정 설정 */}
      <div className="mt-8">
        <InstructorRulesSettings />
      </div>

      {/* 알림 테스트 */}
      <div className="mt-8">
        <NotificationTest />
      </div>

      {/* 강사 알림 발송 */}
      <div className="mt-8">
        <InstructorNotification />
      </div>

      {/* 데이터 백업 관리 */}
      <div className="mt-8">
        <BackupManager />
      </div>
    </div>
  )
}
