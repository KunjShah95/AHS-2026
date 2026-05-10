import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'

const tasks = [
  { id: 1, title: 'Review project structure', priority: 'high', status: 'completed', description: 'Understand the overall codebase organization' },
  { id: 2, title: 'Find main entry points', priority: 'high', status: 'completed', description: 'Locate index.ts and main entry files' },
  { id: 3, title: 'Understand auth flow', priority: 'medium', status: 'in_progress', description: 'Review authentication and authorization patterns' },
  { id: 4, title: 'Review database schema', priority: 'medium', status: 'pending', description: 'Examine data models and migrations' },
  { id: 5, title: 'Study API endpoints', priority: 'low', status: 'pending', description: 'Review REST API documentation' },
  { id: 6, title: 'Run test suite', priority: 'medium', status: 'pending', description: 'Execute and understand test coverage' },
]

export default function Tasks() {
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Tasks
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Track your learning tasks and progress
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600">{completedCount}</div>
          <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
          <div className="text-3xl font-bold text-[var(--accent)]">{inProgressCount}</div>
          <div className="text-sm text-[var(--muted-foreground)]">In Progress</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
          <div className="text-3xl font-bold text-[var(--text-primary)]">{tasks.length}</div>
          <div className="text-sm text-[var(--muted-foreground)]">Total</div>
        </div>
      </motion.div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="font-semibold text-[var(--text-primary)]">All Tasks</h2>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-4 hover:bg-[var(--bg-surface)] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 ${
                  task.status === 'completed' ? 'text-green-500' :
                  task.status === 'in_progress' ? 'text-[var(--accent)]' :
                  'text-[var(--muted-foreground)]'
                }`}>
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : task.status === 'in_progress' ? (
                    <Circle className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium ${
                      task.status === 'completed' ? 'text-[var(--muted-foreground)] line-through' :
                      'text-[var(--text-primary)]'
                    }`}>
                      {task.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">{task.description}</p>
                </div>
                {task.status === 'in_progress' && (
                  <ArrowRight className="w-4 h-4 text-[var(--accent)]" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add Task Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex justify-end"
      >
        <button className="btn btn-primary">
          Add New Task
        </button>
      </motion.div>
    </div>
  )
}