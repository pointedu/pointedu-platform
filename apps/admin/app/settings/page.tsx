export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import SettingsForm from './SettingsForm'
import BackupManager from './BackupManager'

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

      {/* 데이터 백업 관리 */}
      <div className="mt-8">
        <BackupManager />
      </div>
    </div>
  )
}
