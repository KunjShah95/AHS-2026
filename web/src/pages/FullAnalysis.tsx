import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

interface Analysis {
  graph: { nodes: number; edges: number }
  wiki: { pages: number }
  drift: { issues: number }
  techDebt: { total: number }
}

export default function FullAnalysis() {
  const { owner, repo } = useParams()
  const [data, setData] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo data - would fetch from API in production
    setData({
      graph: { nodes: 1247, edges: 3892 },
      wiki: { pages: 89 },
      drift: { issues: 12 },
      techDebt: { total: 245000 }
    })
    setLoading(false)
  }, [owner, repo])

  if (loading) return <div className="loader" />

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>← Back to Dashboard</Link>
        <h1 style={{ marginTop: '0.5rem' }}>{owner}/{repo}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3>Entity Graph</h3>
          <p style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: 'bold' }}>{data?.graph.nodes} nodes</p>
          <p style={{ color: 'var(--text-secondary)' }}>{data?.graph.edges} edges</p>
        </div>
        <div className="card">
          <h3>Wiki Pages</h3>
          <p style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: 'bold' }}>{data?.wiki.pages}</p>
          <p style={{ color: 'var(--text-secondary)' }}>compiled pages</p>
        </div>
        <div className="card">
          <h3>Architecture Drift</h3>
          <p style={{ color: 'var(--warning)', fontSize: '2rem', fontWeight: 'bold' }}>{data?.drift.issues}</p>
          <p style={{ color: 'var(--text-secondary)' }}>issues detected</p>
        </div>
        <div className="card">
          <h3>Tech Debt</h3>
          <p style={{ color: 'var(--error)', fontSize: '2rem', fontWeight: 'bold' }}>${(data?.techDebt.total || 0).toLocaleString()}</p>
          <p style={{ color: 'var(--text-secondary)' }}>total debt</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to={`/repo/${owner}/${repo}`} className="btn">Explore Full Analysis</Link>
      </div>
    </div>
  )
}