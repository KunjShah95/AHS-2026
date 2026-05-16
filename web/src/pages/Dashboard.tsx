import { useState, useEffect } from 'react'

interface Repo {
  id: string
  name: string
  owner: string
  status: 'analyzing' | 'ready' | 'error'
  lastAnalyzed: string
}

export default function Dashboard() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo data
    setRepos([
      { id: '1', name: 'react', owner: 'facebook', status: 'ready', lastAnalyzed: '2024-01-15' },
      { id: '2', name: 'typescript', owner: 'microsoft', status: 'ready', lastAnalyzed: '2024-01-14' },
      { id: '3', name: 'vercel', owner: 'vercel', status: 'analyzing', lastAnalyzed: '2024-01-15' },
    ])
    setLoading(false)
  }, [])

  if (loading) return <div className="loader" />

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <button className="btn">+ Add Repository</button>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {repos.map(repo => (
          <div key={repo.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{repo.owner}/{repo.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Last analyzed: {repo.lastAnalyzed}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className={`badge ${repo.status === 'ready' ? 'success' : repo.status === 'analyzing' ? 'warning' : 'error'}`}>
                {repo.status}
              </span>
              <a href={`/analysis/${repo.owner}/${repo.name}`} className="btn btn-secondary">View</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}