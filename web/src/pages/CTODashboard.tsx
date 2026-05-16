export default function CTODashboard() {
  return (
    <div className="animate-in">
      <h1>CTO Dashboard</h1>
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Repositories</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>127</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>+12 this month</p>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tech Debt</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>$2.4M</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>+8% from last quarter</p>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--error)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Architecture Drift</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--error)' }}>34</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>critical issues</p>
        </div>
        <div className="card" style={{ borderLeft: '3px solid #3b82f6' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Wiki Pages</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>1,842</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>generated</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3>High Priority Actions</h3>
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', borderLeft: '3px solid var(--error)' }}>
              <p style={{ fontWeight: 600 }}>Review 3 critical drift issues</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>react, typescript, vercel repos</p>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', borderLeft: '3px solid var(--warning)' }}>
              <p style={{ fontWeight: 600 }}>Address $500k tech debt</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>auth-service module</p>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', borderLeft: '3px solid var(--accent)' }}>
              <p style={{ fontWeight: 600 }}>Approve new repo onboarding</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>5 pending requests</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>System Health</h3>
          <div style={{ marginTop: '1rem' }}>
            {['API', 'LLM Gateway', 'Knowledge Compiler', 'Database'].map(s => (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>{s}</span>
                <span className="badge success">healthy</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}