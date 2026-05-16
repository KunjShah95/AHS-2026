import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function RepoAnalysis() {
  const { owner, repo } = useParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [owner, repo])

  if (loading) return <div className="loader" />

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>← Back</Link>
        <h1 style={{ marginTop: '0.5rem' }}>{owner}/{repo}</h1>
      </div>

      <div className="card">
        <h2>Repository Analysis</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Full analysis view with entity graph, wiki, drift detection, and tech debt breakdown.
        </p>
        <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
            <h3>Entity Graph</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Functions, classes, imports, exports</p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
            <h3>LLM Wiki</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Generated documentation pages</p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
            <h3>Architecture Drift</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Deviations from intended architecture</p>
          </div>
        </div>
      </div>
    </div>
  )
}