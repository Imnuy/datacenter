import { NextResponse } from 'next/server'
import { loadDashboardSummary } from '@/lib/dashboard-summary'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await loadDashboardSummary()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard summary',
      },
      { status: 500 },
    )
  }
}
