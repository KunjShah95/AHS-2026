import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Terminal, Zap, Shield, Brain, Layers, 
  ChevronRight, ArrowRight, Database, GitBranch, 
  Search, MessageSquare, Lock, Clock, DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'

const features = [
  {
    icon: Terminal,
    title: 'Knowledge Compiler',
    description: 'Compile once, query forever. Transform any repo into an interactive semantic wiki.',
    color: '#22D3EE'
  },
  {
    icon: Shield,
    title: 'Multi-Agent Swarm',
    description: 'Security, Architecture, Refactoring agents that analyze and debate your code.',
    color: '#10B981'
  },
  {
    icon: Layers,
    title: 'Architecture Drift',
    description: 'Detect erosion before it compounds. Layer violations, pattern fragmentation.',
    color: '#8B5CF6'
  },
  {
    icon: DollarSign,
    title: 'Tech Debt = $',
    description: 'Financial model for technical debt. Principal + interest = real prioritization.',
    color: '#F59E0B'
  },
  {
    icon: Brain,
    title: 'Intent Layer',
    description: 'Track WHY code exists. Assumptions, decisions, tradeoffs as institutional memory.',
    color: '#F43F5E'
  },
  {
    icon: Search,
    title: 'Semantic Query',
    description: 'Ask "how does auth work?" Get instant answers from compiled wiki, not raw code.',
    color: '#06B6D4'
  },
]

const stats = [
  { value: '50+', label: 'Languages', suffix: '' },
  { value: '<60', label: 'Seconds', suffix: 's analysis' },
  { value: '10x', label: 'Faster', suffix: 'onboarding' },
  { value: '∞', label: 'Queries', suffix: '' },
]

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-root)] overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 transition-transform duration-[3000ms] ease-out"
          style={{
            background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)',
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-transform duration-[3000ms] ease-out"
          style={{
            background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
            left: `${100 - mousePosition.x}%`,
            top: `${100 - mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 sticky top-0 bg-[var(--bg-root)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#10B981] flex items-center justify-center shadow-lg shadow-[#22D3EE]/20 group-hover:shadow-[#22D3EE]/40 transition-shadow">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">CodeGenome</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors">
                Sign in
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-[#22D3EE] transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs text-[var(--text-secondary)]">LLM Wiki Pattern</span>
              </motion.div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
                Your codebase,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#10B981] to-[#8B5CF6]">
                  understood.
                </span>
              </h1>
              
              <p className="text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed">
                Not documentation. Compile once, maintain persistently, query efficiently. 
                Multi-agent analysis, architecture drift detection, tech debt in dollars.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                <Link to="/analysis">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#22D3EE] text-black font-semibold rounded-xl hover:bg-[#67E8F9] transition-colors shadow-lg shadow-[#22D3EE]/25">
                    <Terminal className="w-4 h-4" />
                    Try Demo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--bg-surface)] text-white font-medium rounded-xl border border-[var(--border-subtle)] hover:border-[#22D3EE]/50 transition-colors">
                  <PlayIcon />
                  Watch Video
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <div className="text-2xl font-bold text-white">{stat.value}{stat.suffix && <span className="text-[#22D3EE]">{stat.suffix}</span>}</div>
                    <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Code visualization */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-[#22D3EE]/20 via-[#10B981]/20 to-[#8B5CF6]/20 rounded-2xl blur-2xl" />
              <div className="relative bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
                  <div className="w-3 h-3 rounded-full bg-[#F43F5E]" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                  <span className="ml-3 text-xs text-[var(--text-muted)] font-mono">codegenome.ts</span>
                </div>
                
                {/* Code content */}
                <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                  <div><span className="text-[#8B5CF6]">const</span> <span className="text-[#22D3EE]">wiki</span> = <span className="text-[#F59E0B]">await</span> compile(repo)</div>
                  <div className="pl-4"><span className="text-[#F59E0B]">.then</span>(extract <span className="text-[#F43F5E]">{"=>"}</span> extract.entities())</div>
                  <div className="pl-4"><span className="text-[#F59E0B]">.then</span>(graph <span className="text-[#F43F5E]">{"=>"}</span> buildGraph(extract))</div>
                  <div className="pl-4"><span className="text-[#F59E0B]">.then</span>(wiki <span className="text-[#F43F5E]">{"=>"}</span> wiki.compile())</div>
                  <div className="mt-4 text-[var(--text-muted)]">// Query infinitely...</div>
                  <div className="mt-2"><span className="text-[#F59E0B]">const</span> answer = <span className="text-[#F59E0B]">await</span> wiki.query(</div>
                  <div className="pl-4"><span className="text-[#10B981]">"How does auth work?"</span></div>
                  <div className="pl-4">)</div>
                  <div className="mt-4"><span className="text-[#10B981]">→</span> <span className="text-[var(--text-secondary)]">"Auth uses JWT with refresh tokens..."</span></div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -right-4 top-10 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#10B981]" />
                  <span className="text-xs text-[var(--text-secondary)]">Your code never leaves your repo</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -left-6 bottom-20 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#22D3EE]" />
                  <span className="text-xs text-[var(--text-secondary)]">&lt;60s analysis</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Not another documentation tool
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              DeepWiki generates wikis on-demand. We compile once, maintain forever.
              That's the Karpathy LLM Wiki pattern.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-default)] transition-all hover:shadow-xl hover:shadow-black/20"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-32 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              From repo to answers in seconds
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect', desc: 'Paste any GitHub URL', icon: GitBranch },
              { step: '02', title: 'Compile', desc: 'AST parsing → entity graph', icon: Database },
              { step: '03', title: 'Query', desc: 'Ask anything, get answers', icon: MessageSquare },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-[var(--text-subtle)] opacity-20 mb-4">{item.step}</div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#10B981] flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link to="/analysis">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-[#22D3EE] text-black font-bold text-lg rounded-xl hover:bg-[#67E8F9] transition-colors shadow-lg shadow-[#22D3EE]/30">
                Try it now
                <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#22D3EE]/20 via-[#8B5CF6]/20 to-[#F43F5E]/20 rounded-2xl blur-2xl" />
            <div className="relative p-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to understand your codebase?
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">
                Start with the free demo. No account required.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/analysis">
                  <button className="px-8 py-4 bg-[#22D3EE] text-black font-bold rounded-xl hover:bg-[#67E8F9] transition-colors">
                    Try Demo
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-8 py-4 bg-[var(--bg-raised)] text-white font-medium rounded-xl border border-[var(--border-subtle)] hover:border-[#22D3EE]/50 transition-colors">
                    Create Account
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#10B981] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-semibold text-white">CodeGenome</span>
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            © 2026 CodeGenome. Built with the LLM Wiki pattern.
          </div>
        </div>
      </footer>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}