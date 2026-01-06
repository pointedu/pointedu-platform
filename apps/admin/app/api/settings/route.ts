import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@pointedu/database'

// GET - Get all settings
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Update multiple settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    // Update each setting
    const updates = await Promise.all(
      settings.map(async (setting: { key: string; value: string }) => {
        return prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value,
            category: 'GENERAL',
          },
        })
      })
    )

    return NextResponse.json(updates)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
