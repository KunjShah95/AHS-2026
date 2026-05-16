export default function Profile() {
  return (
    <div className="animate-in">
      <h1>Profile</h1>
      <div className="card" style={{ marginTop: '2rem', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--bg-primary)' }}>U</div>
          <div>
            <h3>Demo User</h3>
            <p style={{ color: 'var(--text-secondary)' }}>demo@codegenome.ai</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>Repositories</label>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12</p>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>Total Analysis Time</label>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4h 23m</p>
          </div>
        </div>
      </div>
    </div>
  )
}