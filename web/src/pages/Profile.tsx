import { motion } from 'framer-motion'
import { Mail, Github, Calendar, BookOpen, GitBranch, Settings, Edit } from 'lucide-react'

const stats = [
  { label: 'Repositories Analyzed', value: '12' },
  { label: 'Learning Paths Completed', value: '8' },
  { label: 'Hours of Learning', value: '156' },
  { label: 'Team Members', value: '24' },
]

const recentActivity = [
  { action: 'Analyzed', repo: 'facebook/react', time: '2 hours ago', icon: GitBranch },
  { action: 'Completed', path: 'React Fundamentals', time: 'Yesterday', icon: BookOpen },
  { action: 'Queried', question: 'How does useEffect work?', time: '2 days ago', icon: null },
  { action: 'Viewed', page: 'Architecture Overview', time: '3 days ago', icon: null },
]

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Profile
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Manage your account and view activity
        </p>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-8 mb-6 border border-[var(--border-subtle)] shadow-sm"
      >
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-500 flex items-center justify-center text-3xl font-bold text-white">
            JD
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">John Developer</h1>
              <button className="p-2 text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors rounded-lg hover:bg-[var(--bg-surface)]">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[var(--muted-foreground)] mb-4">Full-stack Engineer</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Mail className="w-4 h-4" />
                john@example.com
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Github className="w-4 h-4" />
                @johndev
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Calendar className="w-4 h-4" />
                Joined Jan 2024
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-white rounded-xl p-4 border border-[var(--border-subtle)] shadow-sm text-center"
          >
            <div className="text-2xl font-bold text-[var(--accent)]">{stat.value}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0"
            >
              <div className="flex items-center gap-3">
                {activity.icon ? (
                  <activity.icon className="w-4 h-4 text-[var(--accent)]" />
                ) : (
                  <span className="w-4 h-4 text-[var(--accent)]">
                    {activity.action === 'Queried' ? '?' : '👁'}
                  </span>
                )}
                <div>
                  <span className="text-[var(--muted-foreground)]">{activity.action} </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {activity.repo || activity.path || activity.question || activity.page}
                  </span>
                </div>
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">{activity.time}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 flex gap-4"
      >
        <button className="btn btn-primary">
          <Settings className="w-4 h-4" />
          Account Settings
        </button>
        <button className="btn btn-secondary">
          Edit Profile
        </button>
      </motion.div>
    </div>
  )
}