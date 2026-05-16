import { useState } from 'react'

interface Member {
  name: string
  repos: number
  analyses: number
  contribution: string
}

export default function TeamAnalytics() {
  const [members] = useState<Member[]>([
    { name: 'Alice Chen', repos: 8, analyses: 23, contribution: 'high' },
    { name: 'Bob Martinez', repos: 5, analyses: 12, contribution: 'medium' },
    { name: 'Carol Johnson', repos: 3, analyses: 8, contribution: 'low' },
    { name: 'David Kim', repos: 6, analyses: 18, contribution: 'high' },
  ])

  return (
    <div className="animate-in">
      <h1>Team Analytics</h1>
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Repos</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>22</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Analyses</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>61</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Avg per Member</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>15.25</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>4</p>
          </div>
        </div>

        <div className="card">
          <h3>Team Members</h3>
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            {members.map(m => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{m.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{m.repos} repos · {m.analyses} analyses</p>
                </div>
                <span className={`badge ${m.contribution === 'high' ? 'success' : m.contribution === 'medium' ? 'warning' : ''}`}>{m.contribution}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}