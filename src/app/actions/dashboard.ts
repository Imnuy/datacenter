'use server'

import { loadDashboardSummary, type DashboardSummary } from '@/lib/dashboard-summary'

export type { DashboardSummary }

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return loadDashboardSummary()
}
