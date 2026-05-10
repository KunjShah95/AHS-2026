import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'

const nodes = [
  { id: '1', title: 'Understand Project Structure', status: 'completed', description: 'Learn the codebase organization and folder structure' },
  { id: '2', title: 'Identify Key Files', status: 'completed', description: 'Find main entry points and critical modules' },
  { id: '3', title: 'Core Logic', status: 'in_progress', description: 'Understand business logic and algorithms' },
  { id: '4', title: 'Data Layer', status: 'pending', description: 'Review database schema and data models' },
  { id: '5', title: 'API Endpoints', status: 'pending', description: 'Study REST/GraphQL endpoints and integrations' },
  { id: '6', title: 'Testing Strategy', status: 'pending', description: 'Understand test coverage and patterns' },
]

export default function Roadmap() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Learning Roadmap
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Track your onboarding progress through the codebase
        </p>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-[var(--text-primary)]">Overall Progress</span>
          <span className="text-sm text-[var(--muted-foreground)]">2 of 6 phases completed</span>
        </div>
        <div className="h-3 bg-[var(--bg-surface)] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[var(--accent)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '33%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm text-[var(--muted-foreground)]">
          <Clock className="w-4 h-4" />
          <span>Estimated completion: 4 more phases</span>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="space-y-4">
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`relative bg-white rounded-xl p-5 border transition-all ${
              node.status === 'completed' 
                ? 'border-green-200 shadow-sm' 
                : node.status === 'in_progress'
                ? 'border-[var(--accent)]/30 shadow-md'
                : 'border-[var(--border-subtle)] shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1 ${
                node.status === 'completed' ? 'text-green-500' :
                node.status === 'in_progress' ? 'text-[var(--accent)]' :
                'text-[var(--muted-foreground)]'
              }`}>
                {node.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : node.status === 'in_progress' ? (
                  <Circle className="w-6 h-6 animate-pulse" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`font-semibold ${
                    node.status === 'completed' ? 'text-[var(--muted-foreground)] line-through' :
                    'text-[var(--text-primary)]'
                  }`}>
                    {node.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    node.status === 'completed' ? 'bg-green-100 text-green-700' :
                    node.status === 'in_progress' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {node.status === 'completed' ? 'Completed' :
                     node.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{node.description}</p>
              </div>
              {node.status === 'in_progress' && (
                <ArrowRight className="w-5 h-5 text-[var(--accent)]" />
              )}
            </div>

            {/* Connector Line */}
            {index < nodes.length - 1 && (
              <div className={`absolute left-[27px] top-14 w-0.5 h-8 ${
                node.status === 'completed' ? 'bg-green-200' : 'bg-[var(--border-subtle)]'
              }`} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--border-subtle)]"
      >
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <button className="btn btn-primary">
            Resume Learning
          </button>
          <button className="btn btn-secondary">
            View Resources
          </button>
        </div>
      </motion.div>
    </div>
  )
}