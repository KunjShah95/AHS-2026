import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Loader2, BookOpen, MessageSquare, FileCode2, BarChart3, Shield, ChevronRight, Database, Cpu, Layers, Plus } from 'lucide-react'

const API_BASE = import.meta.env.VITE_KNOWLEDGE_COMPILER_URL || 'http://localhost:3007'

interface RiskData {
  risk_level: string
  score: number
  avg_complexity: number
  high_complexity_count: number
  total_entities: number
}

interface GraphData {
  total_nodes: number
  total_edges: number
  files: number
  by_type: Record<string, number>
}

interface AnalysisResult {
  repo_id: string
  files_count: number
  entities_count: number
  risk: RiskData
  graph: GraphData
  wiki_pages: string[]
}

const sampleRepos = [
  { name: 'facebook/react', language: 'JavaScript', status: 'Active', lastUpdated: '2 hours ago' },
  { name: 'vercel/next.js', language: 'TypeScript', status: 'Active', lastUpdated: '1 day ago' },
  { name: 'tensorflow/tensorflow', language: 'Python', status: 'Analyzing', lastUpdated: 'In progress' },
  { name: 'rust-lang/rust', language: 'Rust', status: 'Completed', lastUpdated: '3 days ago' },
]

export default function RepoAnalysis() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'wiki' | 'query'>('overview')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [pageContent, setPageContent] = useState('')
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeRepo = async () => {
    if (!repoUrl.startsWith('https://github.com/')) {
      setError('Please enter a valid GitHub URL')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze repository')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadWikiPage = async (pageName: string) => {
    if (!result) return

    const [owner, name] = result.repo_id.split('/')

    try {
      const response = await fetch(`${API_BASE}/api/v1/repos/${owner}/${name}/wiki/${pageName}`)
      const data = await response.json()
      setPageContent(data.content)
      setSelectedPage(pageName)
    } catch (err) {
      console.error('Failed to load wiki page:', err)
    }
  }

  const askQuery = async () => {
    if (!result || !query.trim()) return

    setQueryLoading(true)
    const [owner, name] = result.repo_id.split('/')

    try {
      const response = await fetch(`${API_BASE}/api/v1/repos/${owner}/${name}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      })

      const data = await response.json()
      
      if (data.relevant_pages?.length > 0) {
        setQueryResult(data.relevant_pages.map((p: any) => 
          `→ ${p.type}: ${p.name || p.file}`
        ).join('\n'))
      } else {
        setQueryResult('No specific matches found. Try a different query.')
      }
    } catch (err) {
      setQueryResult('Failed to get answer')
    } finally {
      setQueryLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10B981'
      case 'medium': return '#F59E0B'
      case 'high': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'wiki', label: 'Wiki', icon: BookOpen },
    { id: 'query', label: 'Query', icon: MessageSquare },
  ]

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      'JavaScript': '#F7DF1E',
      'TypeScript': '#3178C6',
      'Python': '#3776AB',
      'Rust': '#DEA584',
      'Go': '#00ADD8',
    }
    return colors[lang] || '#6B7280'
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Repositories
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Analyze GitHub repositories and generate semantic wikis
        </p>
      </div>

      {/* Input Section */}
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
            onClick={analyzeRepo} 
            disabled={loading || !repoUrl}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Analyze Repository
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-[var(--error)] text-sm">{error}</p>
        )}
      </motion.div>

      {/* Repository Grid */}
      {!result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Repositories</h2>
            <button className="btn btn-primary btn-sm gap-2">
              <Plus className="w-4 h-4" />
              Add Repository
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleRepos.map((repo, index) => (
              <motion.div
                key={repo.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-xl p-5 border border-[var(--border-subtle)] shadow-sm hover:shadow-md hover:border-[var(--accent)]/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{repo.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">{repo.lastUpdated}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: `${getLanguageColor(repo.language)}20`,
                      color: getLanguageColor(repo.language)
                    }}
                  >
                    {repo.language}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    repo.status === 'Active' ? 'bg-green-100 text-green-700' :
                    repo.status === 'Analyzing' ? 'bg-yellow-100 text-yellow-700' :
                    repo.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {repo.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {result && (
        <>
          {/* Tabs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-1 mb-6 p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] w-fit"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-[var(--accent)] shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Repository Info */}
                <div className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">Repository</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">Basic information</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1 text-[var(--text-primary)]">{result.repo_id}</div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-[var(--bg-surface)] rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{result.files_count}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Files</div>
                    </div>
                    <div className="bg-[var(--bg-surface)] rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[var(--text-primary)]">{result.entities_count}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Entities</div>
                    </div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">Risk Assessment</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">Code complexity</p>
                    </div>
                  </div>
                  <div className="text-center py-4">
                    <div className="text-5xl font-bold mb-2" style={{ color: getRiskColor(result.risk.risk_level) }}>
                      {result.risk.score}
                    </div>
                    <span 
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${getRiskColor(result.risk.risk_level)}20`,
                        color: getRiskColor(result.risk.risk_level)
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        result.risk.risk_level === 'low' ? 'bg-green-500' : 
                        result.risk.risk_level === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></span>
                      {result.risk.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-[var(--muted-foreground)] mb-2">
                      <span>Avg Complexity</span>
                      <span>{result.risk.avg_complexity.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(result.risk.avg_complexity * 10, 100)}%`,
                          backgroundColor: getRiskColor(result.risk.risk_level)
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Entity Graph */}
                <div className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">Entity Graph</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">Code relationships</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-surface)] rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.graph.total_nodes}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Nodes</div>
                    </div>
                    <div className="bg-[var(--bg-surface)] rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[var(--accent)]">{result.graph.total_edges}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">Edges</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-[var(--muted-foreground)] mb-2">Entity Types</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.graph.by_type).map(([type, count]) => (
                        <span key={type} className="px-3 py-1 rounded-full text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'wiki' && (
              <motion.div
                key="wiki"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Wiki List */}
                  <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[var(--border-subtle)]">
                    <div className="p-4 border-b border-[var(--border-subtle)]">
                      <h3 className="font-semibold text-[var(--text-primary)]">Wiki Pages</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{result.wiki_pages.length} pages generated</p>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {result.wiki_pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => loadWikiPage(page)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all ${
                            selectedPage === page 
                              ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]' 
                              : 'hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <FileCode2 className="w-4 h-4" />
                          <span className="truncate text-sm">{page}</span>
                          <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wiki Content */}
                  <div className="flex-1 p-6">
                    <h3 className="font-semibold text-xl mb-4 text-[var(--text-primary)]">
                      {selectedPage || 'Select a page'}
                    </h3>
                    <div className="bg-[var(--bg-surface)] rounded-lg p-4 max-h-[500px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{pageContent || 'Select a page to view content'}</pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'query' && (
              <motion.div
                key="query"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl p-8 border border-[var(--border-subtle)] shadow-sm"
              >
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[var(--accent)]" />
                    <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Query the Codebase</h3>
                    <p className="text-[var(--muted-foreground)]">
                      Ask natural language questions about the repository
                    </p>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., What does the auth module do?"
                      className="input-field flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && askQuery()}
                    />
                    <button 
                      onClick={askQuery} 
                      disabled={queryLoading || !query.trim()}
                      className="btn btn-primary"
                    >
                      {queryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
                    </button>
                  </div>

                  {queryResult && (
                    <div className="bg-[var(--bg-surface)] rounded-lg p-6">
                      <h4 className="font-semibold mb-3 text-[var(--text-primary)]">Answer:</h4>
                      <pre className="whitespace-pre-wrap text-sm font-mono text-[var(--text-secondary)]">
                        {queryResult}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}