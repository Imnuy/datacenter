export interface DashboardSummary {
  hospitals: number
  population: number
  houses: number
  opd: number
  chronic: number
  lab: number
  anc: number
  epi: number
  birth: number
  staff: number
  hbv: number
  hcv: number
  hospitalTypes: { name: string; count: number; color: string; percentage: number }[]
  patientAges: { name: string; count: number; percentage: number; color: string }[]
  genderStats: {
    total: number
    male: number
    female: number
    malePercent: number
    femalePercent: number
  }
}
