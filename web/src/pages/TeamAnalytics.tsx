import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Clock, Award, GitBranch, BookOpen } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const velocityData = [
  { week: 'Week 1', velocity: 45 },
  { week: 'Week 2', velocity: 52 },
  { week: 'Week 3', velocity: 61 },
  { week: 'Week 4', velocity: 58 },
  { week: 'Week 5', velocity: 72 },
  { week: 'Week 6', velocity: 78 },
  { week: 'Week 7', velocity: 85 },
  { week: 'Week 8', velocity: 89 },
]

const retentionData = [
  { module: 'Core Logic', score: 92 },
  { module: 'API Design', score: 78 },
  { module: 'Testing', score: 85 },
  { module: 'Security', score: 71 },
  { module: 'DevOps', score: 88 },
  { module: 'Database', score: 82 },
]

const progressData = [
  { week: 'W1', progress: 20 },
  { week: 'W2', progress: 35 },
  { week: 'W3', progress: 48 },
  { week: 'W4', progress: 62 },
  { week: 'W5', progress: 75 },
  { week: 'W6', progress: 85 },
  { week: 'W7', progress: 92 },
  { week: 'W8', progress: 98 },
]

const completionData = [
  { name: 'Completion', value: 87, fill: '#0D9488' },
]

const teamMembers = [
  { name: 'Sarah Chen', role: 'Senior Engineer', tasks: 24, completed: 22, rampTime: '5 days' },
  { name: 'Mike Johnson', role: 'Backend Dev', tasks: 18, completed: 15, rampTime: '7 days' },
  { name: 'Alex Kim', role: 'Frontend Dev', tasks: 20, completed: 18, rampTime: '4 days' },
  { name: 'Emma Davis', role: 'Full Stack', tasks: 15, completed: 12, rampTime: '6 days' },
]

const recentOnboarding = [
  { name: 'New hire #1', stage: 'Phase 2: Core Logic', progress: 66 },
  { name: 'New hire #2', stage: 'Phase 1: Structure', progress: 25 },
]

const stats = [
  { label: 'Total Members', value: '24', icon: Users, color: '#3B82F6' },
  { label: 'Avg. Ramp Time', value: '5.5 days', icon: Clock, color: '#10B981' },
  { label: 'Completion Rate', value: '89%', icon: TrendingUp, color: '#8B5CF6' },
  { label: 'Learning Paths', value: '12', icon: BookOpen, color: '#F59E0B' },
]

export default function TeamAnalytics() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Team Analytics
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Track team onboarding progress and skill development
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Progress
          </h2>
          <div className="space-y-4">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => setSelectedMember(member.name)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedMember === member.name
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{member.name}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">{member.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{member.completed}/{member.tasks}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">tasks</div>
                  </div>
                </div>
                <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(member.completed / member.tasks) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ backgroundColor: '#3B82F6' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Onboarding Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Active Onboarding
          </h2>
          <div className="space-y-4">
            {recentOnboarding.map((hire, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="p-4 bg-[var(--bg-surface)] rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text-primary)]">{hire.name}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    {hire.progress}%
                  </span>
                </div>
                <div className="text-sm text-[var(--muted-foreground)] mb-3">{hire.stage}</div>
                <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${hire.progress}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ backgroundColor: '#10B981' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-6 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="btn btn-secondary w-full justify-start gap-2">
              <GitBranch className="w-4 h-4" />
              Add New Team Member
            </button>
            <button className="btn btn-secondary w-full justify-start gap-2">
              <BookOpen className="w-4 h-4" />
              Create Learning Path
            </button>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        {/* Onboarding Velocity Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Onboarding Velocity
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="velocity" 
                stroke="#0D9488" 
                strokeWidth={3}
                dot={{ fill: '#0D9488', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#0D9488' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Knowledge Retention Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-navy-800" />
            Knowledge Retention
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="module" tick={{ fontSize: 11 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                labelStyle={{ color: '#374151' }}
                formatter={(value) => [`${value}%`, 'Score']}
              />
              <Bar dataKey="score" fill="#1E293B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Team Progress Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            Team Progress Over Time
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                labelStyle={{ color: '#374151' }}
                formatter={(value) => [`${value}%`, 'Progress']}
              />
              <Area 
                type="monotone" 
                dataKey="progress" 
                stroke="#0D9488" 
                strokeWidth={2}
                fill="url(#progressGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radial Bar - Overall Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Overall Completion
          </h2>
          <div className="relative flex items-center justify-center h-[250px]">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                data={completionData} 
                startAngle={90} 
                endAngle={-270}
              >
                <RadialBar 
                  dataKey="value" 
                  cornerRadius={10}
                  background={{ fill: '#E5E7EB' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold text-[var(--text-primary)]">87%</span>
              <span className="text-sm text-[var(--muted-foreground)]">Complete</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}