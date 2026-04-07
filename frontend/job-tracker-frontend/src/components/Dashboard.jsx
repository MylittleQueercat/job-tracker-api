import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { STATUS_CHART_COLORS } from '../constants'

// Dashboard section: pie chart + 4 stats cards
export default function Dashboard({ jobs }) {
  // Build chart data from job status counts
  function getChartData() {
    const counts = {}
    jobs.forEach(job => {
      counts[job.status] = (counts[job.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({ name: status, value: count }))
  }

  const activeInterviews = jobs.filter(j =>
    j.status === 'interview' || j.status === 'final_interview'
  ).length

  const offers = jobs.filter(j => j.status === 'offer').length

  const successRate = jobs.length === 0 ? 0 : Math.round(
    jobs.filter(j =>
      j.status === 'interview' || j.status === 'final_interview' || j.status === 'offer'
    ).length / jobs.length * 100
  )

  const pending = jobs.filter(j =>
    j.status === 'applied' || j.status === 'phone_screen'
  ).length

  return (
    <div className="rounded-2xl p-8 mb-8"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-white/30 mb-4">
            Dashboard / <span className="text-white/60">Statistics</span>
          </h2>
          <p className="text-4xl font-black tracking-tighter text-white tabular-nums">
            {jobs.length} <span className="text-sm font-normal text-gray-500 tracking-normal ml-1 italic">Entries</span>
          </p>
        </div>
        <div className="hidden md:block px-4 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-widest text-gray-500">
          Live tracking active
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Pie chart */}
        <div className="relative group">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <PieChart width={220} height={220}>
            <Pie
              data={getChartData()}
              cx={110} cy={110}
              innerRadius={70} outerRadius={95}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {getChartData().map((entry, index) => (
                <Cell key={index} fill={STATUS_CHART_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Ratio</span>
            <span className="text-xl font-bold tracking-tighter">Stats</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4 w-full">
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Interviews</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter text-[#f72585]">{activeInterviews}</span>
              <span className="text-[10px] text-gray-600">Active</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Offers</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter text-[#4cc9f0]">{offers}</span>
              <span className="text-[10px] text-gray-600">Total</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Success Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter text-[#7209b7]">{successRate}%</span>
              <span className="text-[10px] text-gray-600">Conversion</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Pending</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tighter text-white/80">{pending}</span>
              <span className="text-[10px] text-gray-600">Response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}