import React, { useState } from 'react';
import { 
  Hospital, 
  Users, 
  UserRound, 
  Stethoscope, 
  Activity, 
  PieChart as PieIcon,
  ChevronRight,
  User,
  Baby,
  UserCheck
} from 'lucide-react';

const App = () => {
  // ข้อมูลจำลองสำหรับ Dashboard
  const stats = {
    totalHospitals: 2,
    totalStaff: 145,
    totalPatients: 842,
    hospitalTypes: [
      { name: 'โรงพยาบาลทั่วไป', count: 1, color: '#2DD4BF', percentage: 50 },
      { name: 'โรงพยาบาลเฉพาะทาง', count: 1, color: '#A3E635', percentage: 50 },
      { name: 'คลินิกในเครือ', count: 0, color: '#FB923C', percentage: 0 },
    ],
    hospitalSizes: [
      { name: 'ขนาดเล็ก (S)', count: 1, percentage: 50, color: '#4C1D95' },
      { name: 'ขนาดกลาง (M)', count: 1, percentage: 50, color: '#DC2626' },
      { name: 'ขนาดใหญ่ (L)', count: 0, percentage: 0, color: '#F59E0B' },
    ],
    patientAges: [
      { name: 'เด็ก (0-15 ปี)', count: 185, percentage: 22, color: '#2DD4BF' },
      { name: 'ผู้ใหญ่ (16-60 ปี)', count: 421, percentage: 50, color: '#10B981' },
      { name: 'ผู้สูงอายุ (60+ ปี)', count: 236, percentage: 28, color: '#A3E635' },
    ],
    deptDistribution: [
      { range: 'ไม่มีผู้ป่วย', count: 0, total: 2, color: 'bg-gray-400' },
      { range: '1 - 50 คน', count: 0, total: 2, color: 'bg-green-500' },
      { range: '51 - 100 คน', count: 1, total: 2, color: 'bg-blue-500', percentage: 50 },
      { range: '101 - 200 คน', count: 0, total: 2, color: 'bg-orange-500' },
      { range: '201 - 500 คน', count: 0, total: 2, color: 'bg-red-500' },
      { range: '500+ คน', count: 1, total: 2, color: 'bg-purple-600', percentage: 50 },
    ],
    genderStats: {
      total: 842,
      male: 404,
      female: 438,
      malePercent: 48,
      femalePercent: 52,
      byDept: [
        { name: 'แผนกอายุรกรรม', male: 142, female: 158, total: 300, malePercent: 47, femalePercent: 53, ratio: "14:16" },
        { name: 'แผนกศัลยกรรม', male: 120, female: 130, total: 250, malePercent: 48, femalePercent: 52, ratio: "12:13" },
        { name: 'แผนกกุมารเวช', male: 142, female: 150, total: 292, malePercent: 49, femalePercent: 51, ratio: "71:75" },
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Row 1: Top Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg flex flex-col justify-between">
            <Hospital size={48} className="mb-4" />
            <div>
              <div className="text-5xl font-bold mb-1">{stats.totalHospitals}</div>
              <div className="text-lg opacity-90">จำนวนโรงพยาบาลทั้งหมด</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl p-8 text-white shadow-lg flex flex-col justify-between">
            <Stethoscope size={48} className="mb-4" />
            <div>
              <div className="text-5xl font-bold mb-1">{stats.totalStaff}</div>
              <div className="text-lg opacity-90">จำนวนแพทย์และบุคลากร</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 text-white shadow-lg flex flex-col justify-between">
            <UserRound size={48} className="mb-4" />
            <div>
              <div className="text-5xl font-bold mb-1">{stats.totalPatients}</div>
              <div className="text-lg opacity-90">จำนวนผู้ป่วยทั้งหมด</div>
            </div>
          </div>
        </div>

        {/* Row 2: Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pie Chart: ประเภทโรงพยาบาล */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 text-center">ประเภทโรงพยาบาล</h3>
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eee" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2DD4BF" strokeWidth="5" strokeDasharray="50 100" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#A3E635" strokeWidth="5" strokeDasharray="50 100" strokeDashoffset="-50" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">2</span>
                <span className="text-xs text-gray-500">โรงพยาบาล</span>
              </div>
            </div>
            <div className="w-full space-y-2 text-sm">
              {stats.hospitalTypes.map((type, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                    <span>{type.name}: {type.count} แห่ง</span>
                  </div>
                  <span className="text-gray-400">({type.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart: ขนาดโรงพยาบาล */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 text-center">ขนาดโรงพยาบาลตามจำนวนเตียง</h3>
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#4C1D95" strokeWidth="6" strokeDasharray="50 100" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#DC2626" strokeWidth="6" strokeDasharray="50 100" strokeDashoffset="-50" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">ทั้งหมด</span>
                <span className="text-3xl font-bold">2</span>
                <span className="text-xs text-gray-400">โรงพยาบาล</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 text-xs">
              {stats.hospitalSizes.map((size, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: size.color }}></div>
                  <span>{size.name} ({size.count} - {size.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Age Group Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-xl font-bold mb-6 text-center">สัดส่วนผู้ป่วยแยกตามช่วงวัย</h3>
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2DD4BF" strokeWidth="4" strokeDasharray="22 100" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="50 100" strokeDashoffset="-22" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#A3E635" strokeWidth="4" strokeDasharray="28 100" strokeDashoffset="-72" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-gray-400 leading-tight">ทั้งหมด</span>
                <span className="text-3xl font-bold">{stats.totalPatients}</span>
                <span className="text-xs text-gray-400 leading-tight">คน</span>
              </div>
            </div>
            <div className="w-full space-y-2 text-sm">
              {stats.patientAges.map((age, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: age.color }}></div>
                    <span>{age.name}: {age.count} คน</span>
                  </div>
                  <span className="text-gray-400">({age.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Patient Distribution by Department */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
            <Activity className="text-blue-500" />
            <h2>จำนวนผู้ป่วยแยกตามความหนาแน่นของแผนก</h2>
          </div>
          
          <div className="bg-purple-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="text-xl font-bold">ภาพรวมการครองเตียง</div>
                  <div className="text-sm opacity-80">การกระจายตัวของผู้ป่วยตามขนาดแผนกการรักษา</div>
                </div>
              </div>
              <div className="bg-white/20 px-6 py-4 rounded-2xl text-center backdrop-blur-sm">
                <div className="text-4xl font-bold">{stats.totalHospitals}</div>
                <div className="text-xs opacity-80">โรงพยาบาลทั้งหมด</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.deptDistribution.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-bold text-indigo-900 mb-1">ผู้ป่วย {item.range}</div>
                    <div className="text-xs text-gray-400">{item.range}</div>
                  </div>
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-white`}>
                    <Hospital size={20} />
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm mb-1">จำนวนแผนก</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-orange-400">{item.count || 0}</span>
                    <span className="text-gray-400 text-sm">/ {item.percentage || 0}%</span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-6">
                  <div 
                    className={`h-full bg-gradient-to-r from-blue-400 to-indigo-500`}
                    style={{ width: `${item.percentage || 0}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="border rounded p-0.5"><ChevronRight size={12} /></span>
                    สัดส่วน: {item.percentage || 0}%
                  </div>
                  <div className="bg-gray-50 px-2 py-1 rounded text-gray-400">
                    {item.count > 0 ? `${item.count} แผนก` : "ไม่มีแผนก"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4: Gender Statistics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
            <span className="text-2xl">👨‍⚕️👩‍⚕️</span>
            <h2>สถิติจำนวนผู้ป่วยแยกตามเพศ</h2>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex justify-between items-center">
            <div className="flex gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full"><Users size={20} /></div>
                <div>
                  <div className="text-sm opacity-80">สถิติรวมทั้งหมด</div>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1">👱‍♂️ ชาย: {stats.genderStats.male} คน ({stats.genderStats.malePercent}%)</span>
                    <span className="flex items-center gap-1">👩 หญิง: {stats.genderStats.female} คน ({stats.genderStats.femalePercent}%)</span>
                    <span className="flex items-center gap-1">🏥 รวม: {stats.genderStats.total} คน</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{stats.genderStats.total}</div>
              <div className="text-xs opacity-80">ผู้ป่วยทั้งหมด</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.genderStats.byDept.map((dept, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <Stethoscope size={18} />
                  <span>{dept.name}</span>
                </div>
                
                <div className="space-y-4">
                  {/* Male Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1 font-medium">👱‍♂️ ชาย: {dept.male} คน</span>
                      <span className="text-gray-400">{dept.malePercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${dept.malePercent}%` }}></div>
                    </div>
                  </div>

                  {/* Female Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1 font-medium">👩 หญิง: {dept.female} คน</span>
                      <span className="text-gray-400">{dept.femalePercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-5 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-400 rounded-full" style={{ width: `${dept.femalePercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center text-xs text-gray-500 border-t">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>รวม: {dept.total} คน</span>
                  </div>
                  <div className="bg-gray-50 px-2 py-1 rounded">
                    อัตราส่วน {dept.ratio}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;