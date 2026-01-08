export const revalidate = 180 // Revalidate every 3 minutes

import { prisma } from '@pointedu/database'
import SettingsLayout from './SettingsLayout'
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
    <SettingsLayout
      children={{
        general: <SettingsForm initialSettings={settings} />,
        instructorRules: <InstructorRulesSettings />,
        notificationTest: <NotificationTest />,
        instructorNotification: <InstructorNotification />,
        backup: <BackupManager />,
      }}
    />
  )
}
