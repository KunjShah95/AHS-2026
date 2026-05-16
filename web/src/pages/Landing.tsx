import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="animate-in">
      <section style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Transform Repositories into <span style={{ color: 'var(--accent)' }}>Knowledge Wikis</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Compile code once, maintain persistently, query efficiently. AI-native code intelligence powered by AST parsing and LLM wikis.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="btn">Get Started</Link>
          <Link to="/dashboard" className="btn btn-secondary">View Demo</Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', padding: '2rem 0' }}>
        <div className="card">
          <h3>Knowledge Compiler</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            AST parsing for Python, JS, TS, Go, Rust, Java → entity graph
          </p>
        </div>
        <div className="card">
          <h3>LLM Wiki</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Persistent wiki that updates when code changes
          </p>
        </div>
        <div className="card">
          <h3>Architecture Drift</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Detect erosion like Drift/Erode tools
          </p>
        </div>
        <div className="card">
          <h3>Tech Debt Financial Model</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Calculate debt in dollars (principal + interest)
          </p>
        </div>
      </section>
    </div>
  )
}