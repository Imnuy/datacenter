'use client'

import { useState, useEffect } from 'react'
import {
    Hospital,
    Users,
    User,
    UserRound,
    Stethoscope,
    Activity,
    ChevronRight,
    Baby,
    Home,
    Building2,
    FlaskConical,
    Syringe,
    Heart
} from 'lucide-react'
import type { DashboardSummary } from '@/lib/dashboard-types'

export default function DashboardOverview() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        const load = async () => {
            try {
                setError('')
                const res = await fetch('/api/dashboard/summary', { signal: controller.signal })
                const json = await res.json()

                if (!res.ok || !json.success) {
                    throw new Error(json.error || 'Failed to load dashboard summary')
                }

                setData(json.data)
            } catch (err: any) {
                if (err?.name !== 'AbortError') {
                    setError(err?.message || 'Failed to load dashboard summary')
                    setData(null)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        load()

        return () => controller.abort()
    }, [])

    const hospitalTypes = data?.hospitalTypes ?? []
    const patientAges = data?.patientAges ?? []
    const genderStats = data?.genderStats ?? {
        total: 0,
        male: 0,
        female: 0,
        malePercent: 0,
        femalePercent: 0,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    const fmt = (n: number | undefined) => n !== undefined ? n.toLocaleString() : '0'

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-1">ภาพรวม Dashboard</h1>
                <p className="text-sm text-slate-500">ข้อมูลภาพรวม อ.วัดโบสถ์ · ปีงบประมาณ 2569</p>
            </div>

            {/* Row 1: Top Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                    <Hospital size={48} className="mb-4 opacity-80" />
                    <div>
                        <div className="text-5xl font-bold mb-1">{fmt(data?.hospitals)}</div>
                        <div className="text-lg opacity-90">จำนวนหน่วยบริการ</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl p-8 text-white shadow-lg flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                    <Stethoscope size={48} className="mb-4 opacity-80" />
                    <div>
                        <div className="text-5xl font-bold mb-1">{fmt(data?.staff)}</div>
                        <div className="text-lg opacity-90">จำนวนบุคลากรทั้งหมด</div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 text-white shadow-lg flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                    <UserRound size={48} className="mb-4 opacity-80" />
                    <div>
                        <div className="text-5xl font-bold mb-1">{fmt(data?.population)}</div>
                        <div className="text-lg opacity-90">จำนวนประชากร (Type 1,3)</div>
                    </div>
                </div>
            </div>

            {/* Row 2: Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pie Chart: ประเภทหน่วยบริการ */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-lg font-bold mb-6 text-center text-slate-700">ประเภทหน่วยบริการ</h3>
                    <div className="relative w-44 h-44 mb-6">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                            {hospitalTypes.reduce((acc, type, i) => {
                                const offset = acc.currentOffset
                                acc.currentOffset += type.percentage
                                return {
                                    elements: [
                                        ...acc.elements,
                                        <circle
                                            key={i}
                                            cx="18" cy="18" r="15.915"
                                            fill="none"
                                            stroke={type.color}
                                            strokeWidth="5"
                                            strokeDasharray={`${type.percentage} 100`}
                                            strokeDashoffset={-offset}
                                        />
                                    ],
                                    currentOffset: acc.currentOffset
                                }
                            }, { elements: [] as any[], currentOffset: 0 }).elements}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-800">{data?.hospitals}</span>
                            <span className="text-xs text-slate-400">แห่ง</span>
                        </div>
                    </div>
                    <div className="w-full space-y-2 text-sm">
                        {hospitalTypes.map((type, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                                    <span>{type.name}: {type.count} แห่ง</span>
                                </div>
                                <span className="text-slate-400">({type.percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Donut Chart: บริการสุขภาพ */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-lg font-bold mb-6 text-center text-slate-700">กิจกรรมบริการหลัก (ปีงบ 69)</h3>
                    <div className="w-full space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Hospital size={18} />
                                </div>
                                <span className="text-sm font-medium text-slate-600">ผู้รับบริการ OPD</span>
                            </div>
                            <span className="font-bold text-slate-800">{fmt(data?.opd)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                                    <FlaskConical size={18} />
                                </div>
                                <span className="text-sm font-medium text-slate-600">รายการตรวจ LAB</span>
                            </div>
                            <span className="font-bold text-slate-800">{fmt(data?.lab)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                                    <Syringe size={18} />
                                </div>
                                <span className="text-sm font-medium text-slate-600">วัคซีน EPI</span>
                            </div>
                            <span className="font-bold text-slate-800">{fmt(data?.epi)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <FlaskConical size={18} />
                                </div>
                                <span className="text-sm font-medium text-slate-600">ไวรัสตับอักเสบบี (HBV)</span>
                            </div>
                            <span className="font-bold text-slate-800">{fmt(data?.hbv)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FlaskConical size={18} />
                                </div>
                                <span className="text-sm font-medium text-slate-600">ไวรัสตับอักเสบซี (HCV)</span>
                            </div>
                            <span className="font-bold text-slate-800">{fmt(data?.hcv)}</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t w-full">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>ความครอบคลุมครัวเรือน</span>
                            <span>{fmt(data?.houses)} หลัง</span>
                        </div>
                    </div>
                </div>

                {/* Patient Age Group Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-lg font-bold mb-6 text-center text-slate-700">สัดส่วนประชากรแยกตามช่วงวัย</h3>
                    <div className="relative w-44 h-44 mb-6">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                            {patientAges.reduce((acc, age, i) => {
                                const offset = acc.currentOffset
                                acc.currentOffset += age.percentage
                                return {
                                    elements: [
                                        ...acc.elements,
                                        <circle
                                            key={i}
                                            cx="18" cy="18" r="15.915"
                                            fill="none"
                                            stroke={age.color}
                                            strokeWidth="5"
                                            strokeDasharray={`${age.percentage} 100`}
                                            strokeDashoffset={-offset}
                                        />
                                    ],
                                    currentOffset: acc.currentOffset
                                }
                            }, { elements: [] as any[], currentOffset: 0 }).elements}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-slate-400 leading-tight">ทั้งหมด</span>
                            <span className="text-3xl font-bold text-slate-800">{fmt(data?.population)}</span>
                            <span className="text-xs text-slate-400 leading-tight">คน</span>
                        </div>
                    </div>
                    <div className="w-full space-y-2 text-sm">
                        {patientAges.map((age, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: age.color }}></div>
                                    <span>{age.name}: {fmt(age.count)}</span>
                                </div>
                                <span className="text-slate-400">({age.percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 3: Gender Statistics */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                    <Users className="text-blue-500" />
                    <h2>สัดส่วนประชากรแยกตามเพศ</h2>
                </div>

                <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <div className="text-sm opacity-80 mb-2">สถิติรวมประชากรทั้งพื้นที่</div>
                        <div className="flex gap-6 text-sm font-medium">
                            <span className="flex items-center gap-2">👱‍♂️ ชาย: {fmt(genderStats.male)} คน ({genderStats.malePercent}%)</span>
                            <span className="flex items-center gap-2">👩 หญิง: {fmt(genderStats.female)} คน ({genderStats.femalePercent}%)</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{fmt(genderStats.total)}</div>
                        <div className="text-xs opacity-80 uppercase tracking-widest">Grand Total</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 text-cyan-600 rounded-full">
                                    <User size={20} />
                                </div>
                                <span className="font-bold text-slate-700">เพศชาย</span>
                            </div>
                            <span className="text-2xl font-bold text-cyan-600">{genderStats.malePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${genderStats.malePercent}%` }}></div>
                        </div>
                        <p className="text-sm text-slate-400">จำนวนทั้งหมด {fmt(genderStats.male)} คน จากประชากรที่ยังไม่จำหน่าย</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
                                    <User size={20} />
                                </div>
                                <span className="font-bold text-slate-700">เพศหญิง</span>
                            </div>
                            <span className="text-2xl font-bold text-rose-500">{genderStats.femalePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400" style={{ width: `${genderStats.femalePercent}%` }}></div>
                        </div>
                        <p className="text-sm text-slate-400">จำนวนทั้งหมด {fmt(genderStats.female)} คน จากประชากรที่ยังไม่จำหน่าย</p>
                    </div>
                </div>
            </div>

            {/* Row 4: Special Indicators */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
                    <Activity className="text-indigo-500" />
                    <h2>ตัวชี้วัดสำคัญ (เรื้อรัง & แม่และเด็ก)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:border-rose-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-sm font-bold text-rose-600 mb-1">โรคเรื้อรัง</div>
                                <div className="text-xs text-slate-400">DM + HT (คนไม่ซ้ำ)</div>
                            </div>
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500">
                                <Heart size={20} />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="text-4xl font-bold text-slate-800">{fmt(data?.chronic)}</div>
                            <div className="text-xs text-slate-400 mt-1">คนในพื้นที่รับผิดชอบ</div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: '45%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:border-pink-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-sm font-bold text-pink-600 mb-1">ฝากครรภ์ ANC</div>
                                <div className="text-xs text-slate-400">ครั้งที่มารับบริการ</div>
                            </div>
                            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500">
                                <Baby size={20} />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="text-4xl font-bold text-slate-800">{fmt(data?.anc)}</div>
                            <div className="text-xs text-slate-400 mt-1">จำนวนการรับบริการสะสม</div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500" style={{ width: '30%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:border-amber-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-sm font-bold text-amber-600 mb-1">การคลอด</div>
                                <div className="text-xs text-slate-400">จำนวนการคลอด ปี 69</div>
                            </div>
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="text-4xl font-bold text-slate-800">{fmt(data?.birth)}</div>
                            <div className="text-xs text-slate-400 mt-1">คน (เกิดในระบบ)</div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: '15%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
