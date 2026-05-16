import { useState } from 'react'

interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
}

export default function Tasks() {
  const [tasks] = useState<Task[]>([
    { id: '1', title: 'Analyze react repository', status: 'completed', priority: 'high' },
    { id: '2', title: 'Review tech debt report', status: 'in_progress', priority: 'medium' },
    { id: '3', title: 'Fix architecture drift issues', status: 'pending', priority: 'low' },
  ])

  return (
    <div className="animate-in">
      <h1>Tasks</h1>
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem', maxWidth: '600px' }}>
        {tasks.map(task => (
          <div key={task.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{task.title}</h3>
              <span className={`badge ${task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : ''}`}>
                {task.priority}
              </span>
            </div>
            <span className={`badge ${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : ''}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}