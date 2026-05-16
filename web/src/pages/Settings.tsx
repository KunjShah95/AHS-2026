import { useState } from 'react'

export default function Settings() {
  const [llmProvider, setLlmProvider] = useState('openai')
  const [llmEnabled, setLlmEnabled] = useState(true)

  return (
    <div className="animate-in">
      <h1>Settings</h1>

      <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
        <div className="card">
          <h3>LLM Configuration</h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={llmEnabled} onChange={e => setLlmEnabled(e.target.checked)} />
              Enable LLM features
            </label>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Provider</label>
              <select value={llmProvider} onChange={e => setLlmProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="azure">Azure OpenAI</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>API Keys</h3>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>OpenAI API Key</label>
            <input type="password" placeholder="sk-..." style={{ width: '100%' }} />
          </div>
        </div>

        <button className="btn">Save Settings</button>
      </div>
    </div>
  )
}