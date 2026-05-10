import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { TrendingUp, Clock, DollarSign, Users, Play, BarChart3, BookOpen, ArrowRight } from 'lucide-react'

const stats = [
  { label: 'On Track', value: '87%', icon: TrendingUp, color: '#10B981' },
  { label: 'Avg Time to Competency', value: '12 days', icon: Clock, color: 'var(--accent)' },
  { label: 'Cost Saved', value: '$45K', icon: DollarSign, color: '#F59E0B' },
  { label: 'Active Learners', value: '24', icon: Users, color: 'var(--secondary)' },
]

const learningCourses = [
  { name: 'Auth Patterns', progress: 75, module: '8/12 modules' },
  { name: 'API Design', progress: 45, module: '5/12 modules' },
  { name: 'Database Schema', progress: 90, module: '11/12 modules' },
]

const teamActivity = [
  { user: 'Alex', action: 'completed', item: 'Auth Patterns', time: '2h ago' },
  { user: 'Jordan', action: 'started', item: 'API Design', time: '5h ago' },
  { user: 'Priya', action: 'scored 95% on quiz', item: 'Database Schema', time: 'Yesterday' },
]

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Dashboard
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Track your learning progress and team activity
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
            <div 
              className="text-2xl font-bold mb-1" 
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Learning Progress */}
        <div className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Continue Learning
          </h2>
          
          {/* Overall Progress */}
          <div className="mb-6 p-4 bg-[var(--bg-surface)] rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">Overall Progress</span>
              <span className="text-sm text-[var(--muted-foreground)]">8/12 modules</span>
            </div>
            <div className="h-3 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--accent)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '66%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Course List */}
          <div className="space-y-4">
            {learningCourses.map((course, index) => (
              <motion.div
                key={course.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-4 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-[var(--text-primary)]">{course.name}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{course.module}</span>
                </div>
                <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[var(--accent)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Activity
          </h2>
          
          <div className="space-y-4">
            {teamActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-medium text-sm">
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{activity.user}</span>{' '}
                    <span className="text-[var(--text-secondary)]">{activity.action}</span>{' '}
                    <span className="font-medium text-[var(--accent)]">{activity.item}</span>
                  </div>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{activity.time}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Quick Actions</h3>
            <div className="flex gap-3">
              <Link to="/courses">
                <Button className="gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
                  <Play className="w-4 h-4" />
                  Start New Course
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}