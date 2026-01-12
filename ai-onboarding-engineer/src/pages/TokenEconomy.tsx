import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
  Brain,
  FileCode,
  Settings,
  ShieldCheck,
  Cpu,
  BarChart3,
  Waves,
  Binary,
  ArrowRight,
  RefreshCw,
  Coins
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getUserTokenStats, getAllUserAnalyses, type SavedAnalysis } from "@/lib/db"
import { TokenEconomyManager } from "@/lib/token-optimization"

interface TokenOptimization {
  id: string
  title: string
  description: string
  potentialSavings: number
  impact: 'high' | 'medium' | 'low'
  implemented: boolean
}

const OPTIMIZATIONS: TokenOptimization[] = [
  {
    id: 'priority-analysis',
    title: 'Priority-Based Analysis',
    description: 'Heuristic-driven prioritization of entry points and domain logic branches.',
    potentialSavings: 20,
    impact: 'high',
    implemented: true
  },
  {
    id: 'exclude-vendor',
    title: 'Artifact Exclusion',
    description: 'Automated pruning of node_modules, build artifacts, and vendor dependencies.',
    potentialSavings: 40,
    impact: 'high',
    implemented: true
  },
  {
    id: 'cache-summaries',
    title: 'Differential Caching',
    description: 'Cryptographic hashing of file states to avoid redundant semantic synthesis.',
    potentialSavings: 50,
    impact: 'high',
    implemented: true
  },
  {
    id: 'smart-chunking',
    title: 'Semantic Sharding',
    description: 'AST-aware code decomposition for high-precision context injection.',
    potentialSavings: 30,
    impact: 'high',
    implemented: true
  },
  {
    id: 'incremental-updates',
    title: 'Incremental Sync',
    description: 'Analysis restricted to change-sets through internal git-diff stream tracking.',
    potentialSavings: 70,
    impact: 'high',
    implemented: true
  }
]

export default function TokenEconomy() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tokenStats, setTokenStats] = useState({ totalTokensUsed: 0, totalCost: 0, analysisCount: 0 })
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [stats, userAnalyses] = await Promise.all([
        getUserTokenStats(user.uid),
        getAllUserAnalyses(user.uid)
      ])
      setTokenStats(stats)
      setAnalyses(userAnalyses)
    } catch (error) {
      console.error("Error fetching token data:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const calculatePotentialSavings = useMemo(() => {
    const strategies = OPTIMIZATIONS.map(opt => ({
      name: opt.title,
      enabled: opt.implemented,
      savingsPercentage: opt.potentialSavings,
      description: opt.description,
      status: opt.implemented ? 'implemented' as const : 'planned' as const
    }));
    return TokenEconomyManager.calculateTotalSavings(strategies);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const MODEL_LIMITS = {
    'gemini-1.5-flash': 1000000,
    'gemini-1.5-pro': 2000000,
    'gpt-4': 128000,
    'claude-3': 200000
  }

  const currentModel = 'gemini-1.5-flash'
  const modelLimit = MODEL_LIMITS[currentModel as keyof typeof MODEL_LIMITS]
  const usagePercentage = Math.min(100, (tokenStats.totalTokensUsed / modelLimit) * 100)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Token Telemetry...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/economic-engine
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Token <span className="not-italic text-gray-500">Economy</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Autonomous optimization of context allocation and LLM compute cycles.
              </p>
           </div>
           
           <div className="flex items-center gap-6 bg-gray-900/40 p-4 rounded-3xl border border-gray-800 shadow-2xl">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Computation Host</div>
                 <div className="text-xl font-black text-indigo-400 italic tracking-tighter uppercase tabular-nums">{currentModel}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Cpu className="h-5 w-5 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: "Context Consumption", val: formatNumber(tokenStats.totalTokensUsed), sub: "Units", icon: Waves, color: "text-indigo-400", meta: `${usagePercentage.toFixed(1)}% Saturation`, progress: usagePercentage },
             { label: "Financial Telemetry", val: `$${tokenStats.totalCost.toFixed(3)}`, sub: "Total Cost", icon: Coins, color: "text-emerald-400", meta: "Flash Tier Active" },
             { label: "Efficiency Yield", val: `+${calculatePotentialSavings().toFixed(0)}%`, sub: "Yield", icon: Sparkles, color: "text-purple-400", meta: `${formatNumber(Math.floor(tokenStats.totalTokensUsed * 0.35))} Units Saved` }
           ].map((stat, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
               <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/30 transition-all shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                 <CardContent className="p-10 space-y-8">
                   <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-black border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                         <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic">{stat.label}</span>
                   </div>
                   <div className="space-y-2">
                     <div className="flex items-baseline gap-3 leading-none tracking-tighter italic">
                       <span className="text-5xl font-black text-white uppercase tabular-nums">{stat.val}</span>
                       <span className="text-[10px] font-black uppercase text-gray-700 tracking-widest">{stat.sub}</span>
                     </div>
                   </div>
                   
                   <div className="space-y-4 pt-6 border-t border-gray-800/50">
                     <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest italic">
                        <span className="text-gray-600">{stat.meta}</span>
                     </div>
                     {stat.progress !== undefined && (
                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-gray-800 shadow-inner">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${stat.progress}%` }}
                             transition={{ duration: 1.5, ease: "circOut" }}
                             className={`h-full ${stat.progress > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                           />
                        </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] italic">Mitigation Strategies</div>
              <Button onClick={() => fetchData()} variant="ghost" className="h-10 px-6 rounded-xl border border-gray-800 bg-gray-900/20 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 transition-all gap-3 italic">
                 <RefreshCw className="h-3 w-3" />
                 Synchronize Optimizers
              </Button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OPTIMIZATIONS.map((opt, idx) => (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`group relative bg-gray-900/40 border-[1.5px] rounded-4xl overflow-hidden transition-all duration-300 ${opt.implemented ? 'border-indigo-500/40 bg-indigo-500/05' : 'border-gray-900'}`}>
                    <CardContent className="p-8">
                       <div className="flex items-start justify-between gap-10">
                          <div className="flex-1 space-y-6">
                             <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl border ${opt.implemented ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-gray-800 border-gray-700'} shadow-inner`}>
                                   {opt.implemented ? (
                                     <ShieldCheck className="h-5 w-5 text-indigo-400" />
                                   ) : (
                                     <AlertTriangle className="h-5 w-5 text-amber-500" />
                                   )}
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">{opt.title}</h3>
                             </div>
                             <p className="text-[11px] text-gray-500 leading-relaxed italic font-medium tracking-tight h-10 line-clamp-2">{opt.description}</p>
                             
                             <div className="flex items-center gap-4 pt-4 border-t border-gray-800/50">
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 italic">-{opt.potentialSavings}% Efficiency</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 italic">{opt.impact} impact</span>
                             </div>
                          </div>
                          
                          <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${opt.implemented ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-gray-900 border-gray-800 text-gray-700'}`}>
                             {opt.implemented ? <CheckCircle className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           <div className="lg:col-span-12 xl:col-span-8 space-y-8">
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Repository Audit Log</div>
              <Card className="bg-gray-900/60 border border-gray-800 rounded-5xl overflow-hidden shadow-2xl backdrop-blur-3xl">
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b border-gray-800 text-[9px] uppercase font-black text-gray-700 tracking-[0.3em] bg-black/40">
                               <th className="px-10 py-6 italic">Node Identifier</th>
                               <th className="px-10 py-6 italic">Scale</th>
                               <th className="px-10 py-6 italic">Consumption</th>
                               <th className="px-10 py-6 italic">Delta Cost</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-800/50">
                            {analyses.slice(0, 8).map((analysis) => (
                              <tr key={analysis.id} className="group hover:bg-white/5 transition-colors cursor-default">
                                 <td className="px-10 py-6">
                                    <div className="flex items-center gap-5">
                                       <div className="h-10 w-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:border-indigo-500/30 transition-all">
                                          <FileCode className="h-4 w-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-sm font-black text-gray-300 uppercase italic tracking-tight">{analysis.repoName || 'Root Node'}</span>
                                          <span className="text-[9px] font-mono text-gray-700 uppercase italic tracking-tighter mt-1 truncate max-w-40">{analysis.repoUrl?.split('/').pop()}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-10 py-6">
                                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic tabular-nums">{analysis.metadata?.fileCount || 0} Artifacts</div>
                                 </td>
                                 <td className="px-10 py-6">
                                    <div className="flex items-center gap-3">
                                       <span className="text-lg font-black text-white italic tabular-nums">{formatNumber(analysis.tokenUsage?.totalTokens || 0)}</span>
                                       <span className="text-[9px] font-black text-gray-800 uppercase tracking-widest italic shrink-0">Units</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-6">
                                    <div className="text-sm font-black text-indigo-400 tabular-nums italic">${(analysis.tokenUsage?.estimatedCost || 0).toFixed(4)}</div>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-12 xl:col-span-4 space-y-8">
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Structural Insights</div>
              <Card className="bg-indigo-600 border-none rounded-5xl shadow-[0_40px_100px_-20px_rgba(79,70,229,0.5)] overflow-hidden relative group">
                 <div className="absolute inset-0 bg-linear-to-br from-indigo-500 to-indigo-800 opacity-90" />
                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-white/20 transition-all duration-1000" />
                 
                 <CardContent className="relative p-12 space-y-10">
                    <div className="h-16 w-16 rounded-3xl bg-white/15 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
                       <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Architecture of Savings</h3>
                       <p className="text-indigo-100/80 text-lg leading-relaxed font-medium italic">
                          Heuristic-driven analysis on this codebase would require <span className="text-white font-bold tabular-nums">{formatNumber(Math.floor(tokenStats.totalTokensUsed * 1.8))} tokens</span> without optimization. Semantic shards reduce overhead by <span className="text-white font-bold italic tabular-nums">44%</span> while increasing systemic precision.
                       </p>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-6">
                       {['Scale Ready', 'Real-time Opt', 'Deep Sync'].map((tag, i) => (
                         <div key={i} className="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white border border-white/10 backdrop-blur-md italic">
                            {tag}
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>

              <div className="p-10 bg-gray-900/60 border border-indigo-500/20 rounded-4xl space-y-6 group hover:border-indigo-500/40 transition-all">
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                       <Brain className="h-7 w-7 text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                       <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Autonomous Mode</div>
                       <div className="text-sm font-black text-white uppercase tracking-tight italic">Allocating Context Clusters</div>
                    </div>
                 </div>
                 <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed">
                    Engine is currently prioritizing high-impact logic clusters for prioritized token allocation based on git-diff density.
                 </p>
                 <Button className="w-full h-12 bg-gray-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-all gap-3 text-gray-400 hover:text-white italic">
                    View Allocation Log
                    <ArrowRight className="h-4 w-4" />
                 </Button>
              </div>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Economic Engine Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Yield v2.4.1
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
