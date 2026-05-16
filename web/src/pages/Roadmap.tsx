import { useState } from 'react'

interface Milestone {
  id: string
  title: string
  phase: string
  status: 'planned' | 'active' | 'completed'
  progress: number
}

export default function Roadmap() {
  const [milestones] = useState<Milestone[]>([
    { id: '1', title: 'Knowledge Compiler v1', phase: 'Phase 1', status: 'completed', progress: 100 },
    { id: '2', title: 'LLM Wiki Engine', phase: 'Phase 2', status: 'active', progress: 65 },
    { id: '3', title: 'Multi-Agent System', phase: 'Phase 3', status: 'active', progress: 40 },
    { id: '4', title: 'Architecture Drift Detection', phase: 'Phase 4', status: 'planned', progress: 0 },
    { id: '5', title: 'Tech Debt Financial Model', phase: 'Phase 5', status: 'planned', progress: 0 },
  ])

  return (
    <div className="animate-in">
      <h1>Roadmap</h1>
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem', maxWidth: '700px' }}>
        {milestones.map(m => (
          <div key={m.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>{m.phase}</span>
                <h3 style={{ marginTop: '0.25rem' }}>{m.title}</h3>
              </div>
              <span className={`badge ${m.status === 'completed' ? 'success' : m.status === 'active' ? 'warning' : ''}`}>{m.status}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${m.progress}%`, background: m.status === 'completed' ? 'var(--accent)' : 'var(--warning)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>{m.progress}% complete</span>
          </div>
        ))}
      </div>
    </div>
  )
}