import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, Shield, Zap, ArrowRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const velocityTrendData = [
  { month: 'Jan', frontend: 72, backend: 68, mobile: 55 },
  { month: 'Feb', frontend: 75, backend: 72, mobile: 58 },
  { month: 'Mar', frontend: 78, backend: 75, mobile: 60 },
  { month: 'Apr', frontend: 82, backend: 76, mobile: 62 },
  { month: 'May', frontend: 85, backend: 78, mobile: 65 },
  { month: 'Jun', frontend: 88, backend: 82, mobile: 68 },
]

const bottleneckData = [
  { issue: 'Security Review', impact: 85, severity: 'high' },
  { issue: 'Code Review', impact: 72, severity: 'medium' },
  { issue: 'Testing', impact: 65, severity: 'medium' },
  { issue: 'Documentation', impact: 45, severity: 'low' },
  { issue: 'Deployment', impact: 38, severity: 'low' },
]

const metrics = [
  { label: 'Team Velocity', value: '72%', trend: '+5%', trendUp: true, icon: TrendingUp },
  { label: 'At Risk', value: '3', trend: '-2', trendUp: true, icon: Shield },
  { label: 'Avg. Ramp Time', value: '14 days', trend: '-3 days', trendUp: true, icon: Clock },
  { label: 'Skill Coverage', value: '85%', trend: '+10%', trendUp: true, icon: Zap },
]

const teamOverview = [
  { name: 'Frontend Team', members: 8, velocity: 85, status: 'on-track' },
  { name: 'Backend Team', members: 12, velocity: 78, status: 'on-track' },
  { name: 'DevOps Team', members: 4, velocity: 92, status: 'excellent' },
  { name: 'Mobile Team', members: 6, velocity: 65, status: 'attention' },
]

const recommendations = [
  'Increase DevOps training sessions',
  'Pair experienced with new engineers',
  'Focus on security best practices',
  'Review mobile team velocity',
]

export default function CTODashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          CTO Dashboard
        </h1>
        <p className="text-[var(--muted-foreground)]">
          High-level team metrics and strategic insights
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.label} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <m.icon className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <span className={`text-sm font-medium ${m.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {m.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{m.value}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{m.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Team Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Overview
          </h2>
          <div className="space-y-4">
            {teamOverview.map((team, index) => (
              <div key={team.name} className="p-4 rounded-lg bg-[var(--bg-surface)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text-primary)]">{team.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    team.status === 'excellent' ? 'bg-green-100 text-green-700' :
                    team.status === 'on-track' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {team.status === 'excellent' ? 'Excellent' :
                     team.status === 'on-track' ? 'On Track' : 'Needs Attention'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)] mb-2">
                  <span>{team.members} members</span>
                  <span>{team.velocity}% velocity</span>
                </div>
                <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${team.velocity}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    style={{ 
                      backgroundColor: team.velocity >= 80 ? '#10B981' : 
                                       team.velocity >= 60 ? '#F59E0B' : '#EF4444'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Recommendations
          </h2>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-surface)] transition-colors cursor-pointer group"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[var(--text-secondary)] flex-1">{rec}</span>
                <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--accent)] transition-colors" />
              </motion.li>
            ))}
          </ul>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Quick Actions</h3>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm">View Reports</button>
              <button className="btn btn-secondary btn-sm">Team Settings</button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        {/* Team Velocity Trends Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Team Velocity Trends
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={velocityTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" domain={[50, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                labelStyle={{ color: '#374151' }}
                formatter={(value) => [`${value}%`, 'Velocity']}
              />
              <Legend />
              <Line type="monotone" dataKey="frontend" name="Frontend" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="backend" name="Backend" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="mobile" name="Mobile" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bottleneck Analysis Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            Bottleneck Analysis
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bottleneckData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" domain={[0, 100]} />
              <YAxis type="category" dataKey="issue" tick={{ fontSize: 12 }} stroke="#6B7280" width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                labelStyle={{ color: '#374151' }}
                formatter={(value) => [`${value}%`, 'Impact']}
              />
              <Bar 
                dataKey="impact" 
                radius={[0, 4, 4, 0]}
                fill="#8B5CF6"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}