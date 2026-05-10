import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Loader2, Shield, Building2, DollarSign, Brain, ChevronDown, ChevronRight, Terminal, Cpu } from 'lucide-react'

const API_BASE = import.meta.env.VITE_KNOWLEDGE_COMPILER_URL || 'http://localhost:3007'

interface FullAnalysis {
  repository: string
  basic_stats: {
    files: number
    entities: number
    risk_score: number
  }
  multi_agent: {
    overall_health: number
    aggregated: Record<string, { avg_score: number; total_findings: number }>
  }
  architecture_drift: {
    score: number
    grade: string
    signals: Record<string, number>
    findings_count: number
  }
  tech_debt: {
    debt_principal: number
    monthly_interest: number
    total_debt_annual: number
    risk_level: string
    grade: string
  }
  intent_layer: {
    total_entries: number
    by_type: Record<string, number>
    by_tag: Record<string, number>
    files_covered: number
  }
}

export default function FullAnalysis() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('agents')

  const runFullAnalysis = async () => {
    if (!repoUrl.startsWith('https://github.com/')) {
      setError('Please enter a valid GitHub URL')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const analyzeResponse = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl })
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze repository')
      }

      await analyzeResponse.json()
      setAnalyzing(true)

      const path = repoUrl.replace('https://github.com/', '')
      const [owner, name] = path.split('/')

      const fullResponse = await fetch(`${API_BASE}/api/v1/repos/${owner}/${name}/full-analysis`)
      
      if (!fullResponse.ok) {
        throw new Error('Failed to get full analysis')
      }

      const data = await fullResponse.json()
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setAnalyzing(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      A: '#10B981',
      B: '#3B82F6', 
      C: '#F59E0B',
      D: '#F97316',
      F: '#EF4444',
    }
    return colors[grade] || '#6B7280'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Full Analysis
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Multi-agent analysis • Architecture drift • Tech debt • Intent tracking
        </p>
      </motion.div>

      {/* Input */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-5 mb-8 border border-[var(--border-subtle)] shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <GitBranch className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="input-field w-full pl-12"
            />
          </div>
          <button 
            onClick={runFullAnalysis} 
            disabled={loading || !repoUrl}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {analyzing ? 'Analyzing...' : 'Starting...'}
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-[var(--error)] text-sm">{error}</p>
        )}
      </motion.div>

      {/* Results */}
      {analysis && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">{analysis.basic_stats.files}</div>
              <div className="text-sm text-[var(--muted-foreground)]">Files</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">{analysis.basic_stats.entities}</div>
              <div className="text-sm text-[var(--muted-foreground)]">Entities</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
              <div className="text-3xl font-bold" style={{ color: getGradeColor(analysis.architecture_drift.grade) }}>
                {analysis.architecture_drift.grade}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">Drift Grade</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm text-center">
              <div className="text-3xl font-bold text-red-600">{formatCurrency(analysis.tech_debt.debt_principal)}</div>
              <div className="text-sm text-[var(--muted-foreground)]">Tech Debt</div>
            </div>
          </div>

          {/* Multi-Agent Analysis */}
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
              onClick={() => toggleSection('agents')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Multi-Agent Analysis</span>
                  <span className="text-sm text-[var(--muted-foreground)] ml-2">
                    ({Object.keys(analysis.multi_agent.aggregated).length} agents)
                  </span>
                </div>
              </div>
              {expandedSection === 'agents' ? <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />}
            </div>
            <AnimatePresence>
              {expandedSection === 'agents' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {Object.entries(analysis.multi_agent.aggregated).map(([agent, data]: [string, any]) => (
                      <div key={agent} className="bg-[var(--bg-surface)] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold" style={{ color: getScoreColor(data.avg_score) }}>
                          {data.avg_score.toFixed(0)}
                        </div>
                        <div className="text-sm text-[var(--text-primary)] capitalize">{agent}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">{data.total_findings} findings</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">Overall Health Score</span>
                      <span className="text-2xl font-bold" style={{ color: getScoreColor(analysis.multi_agent.overall_health) }}>
                        {analysis.multi_agent.overall_health.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="h-3 bg-[var(--border-subtle)] rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${analysis.multi_agent.overall_health}%`,
                          backgroundColor: getScoreColor(analysis.multi_agent.overall_health)
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Architecture Drift */}
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
              onClick={() => toggleSection('drift')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Architecture Drift</span>
                  <span className="text-sm text-[var(--muted-foreground)] ml-2">
                    ({analysis.architecture_drift.findings_count} signals)
                  </span>
                </div>
              </div>
              {expandedSection === 'drift' ? <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />}
            </div>
            <AnimatePresence>
              {expandedSection === 'drift' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold" style={{ color: getGradeColor(analysis.architecture_drift.grade) }}>
                        {analysis.architecture_drift.grade}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[var(--text-primary)]">{analysis.architecture_drift.score.toFixed(1)}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Drift Score</div>
                    </div>
                    <div className="col-span-2 md:col-span-2">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(analysis.architecture_drift.signals).slice(0, 4).map(([signal, count]) => (
                          <div key={signal} className="p-3 rounded-lg bg-[var(--bg-surface)] text-center">
                            <div className="text-lg font-bold text-[var(--text-primary)]">{count}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{signal}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tech Debt */}
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
              onClick={() => toggleSection('debt')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Tech Debt (Financial Model)</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                    analysis.tech_debt.risk_level === 'critical' || analysis.tech_debt.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                    analysis.tech_debt.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {analysis.tech_debt.risk_level}
                  </span>
                </div>
              </div>
              {expandedSection === 'debt' ? <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />}
            </div>
            <AnimatePresence>
              {expandedSection === 'debt' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="bg-white rounded-lg p-4 border border-[var(--border-subtle)] text-center">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(analysis.tech_debt.debt_principal)}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Debt Principal</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-[var(--border-subtle)] text-center">
                      <div className="text-2xl font-bold text-yellow-600">{formatCurrency(analysis.tech_debt.monthly_interest)}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Monthly Interest</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-[var(--border-subtle)] text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(analysis.tech_debt.total_debt_annual)}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Annual Cost</div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <p className="text-sm text-[var(--text-secondary)]">
                      💡 This represents the cost to fix all issues plus the ongoing velocity slowdown 
                      caused by codebase complexity. Prioritize high-impact refactoring to reduce this.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Intent Layer */}
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
              onClick={() => toggleSection('intent')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Intent Layer</span>
                  <span className="text-sm text-[var(--muted-foreground)] ml-2">
                    ({analysis.intent_layer.total_entries} entries extracted)
                  </span>
                </div>
              </div>
              {expandedSection === 'intent' ? <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />}
            </div>
            <AnimatePresence>
              {expandedSection === 'intent' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="bg-white rounded-lg p-4 border border-[var(--border-subtle)] text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{analysis.intent_layer.total_entries}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Total Entries</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-[var(--border-subtle)] text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{analysis.intent_layer.files_covered}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Files Covered</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-[var(--border-subtle)] text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{Object.keys(analysis.intent_layer.by_tag).length}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Unique Tags</div>
                    </div>
                  </div>
                  {Object.keys(analysis.intent_layer.by_type).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(analysis.intent_layer.by_type).map(([type, count]) => (
                        <span key={type} className="px-3 py-1 rounded-full text-xs bg-cyan-100 text-cyan-700">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl p-12 border border-[var(--border-subtle)] shadow-sm text-center"
        >
          <Terminal className="w-16 h-16 mx-auto mb-4 text-[var(--muted-foreground)]" />
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Run Full Analysis</h3>
          <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
            Enter a GitHub repository URL to run comprehensive analysis including 
            multi-agent checks, architecture drift detection, tech debt calculation, 
            and intent tracking.
          </p>
        </motion.div>
      )}
    </div>
  )
}