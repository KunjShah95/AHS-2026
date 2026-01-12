import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Terminal, 
  GitBranch, 
  Zap,
  TrendingUp,
  FolderGit2,
  ArrowRight,
  Activity,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Box,
  Binary
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Link } from "react-router-dom"
import SavedRepos from "@/components/SavedRepos"
import { getUserTokenStats, getAllUserAnalyses } from "@/lib/db"

interface TokenStats {
  totalTokensUsed: number
  totalCost: number
  analysisCount: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tokenStats, setTokenStats] = useState<TokenStats>({ totalTokensUsed: 0, totalCost: 0, analysisCount: 0 })
  const [repoCount, setRepoCount] = useState(0)
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const [stats, analyses] = await Promise.all([
        getUserTokenStats(user.uid),
        getAllUserAnalyses(user.uid)
      ])
      setTokenStats(stats)
      setRepoCount(analyses.length)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const metrics = [
    {
      label: "Node Population",
      value: repoCount.toString(),
      sub: repoCount > 0 ? "Active Nodes" : "Awaiting Init",
      icon: FolderGit2,
      color: "text-indigo-400"
    },
    {
      label: "Analysis Cycles",
      value: tokenStats.analysisCount.toString(),
      sub: "Lifetime Exec",
      icon: RefreshCw,
      color: "text-purple-400"
    },
    {
      label: "Compute Volume",
      value: tokenStats.totalTokensUsed > 0 
        ? `${(tokenStats.totalTokensUsed / 1000).toFixed(1)}K`
        : "0",
      sub: tokenStats.totalCost > 0 
        ? `$${tokenStats.totalCost.toFixed(3)}`
        : "$0.00",
      icon: Zap,
      color: "text-amber-400"
    },
    {
      label: "Strategic Readiness",
      value: `${Math.min(100, repoCount * 15)}%`,
      sub: "Institutional coverage",
      icon: TrendingUp,
      color: "text-emerald-400"
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Booting Command Suite...</span>
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
                 /archive/command-suite
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Fleet <span className="not-italic text-gray-500">Console</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                System: <span className="text-gray-300 not-italic">{user?.email || "developer@codeflow.sh"}</span>
              </p>
           </div>
           
           <Link to="/analysis" className="shrink-0">
              <Button className="h-16 px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-4 group italic">
                <Terminal className="h-4 w-4" />
                Initialize Discovery
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
           </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {metrics.map((metric, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
               <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/30 transition-all shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                 <CardContent className="p-10 space-y-8">
                   <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-black border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                         <metric.icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic">{metric.label}</span>
                   </div>
                   <div className="space-y-2">
                     <div className="flex items-baseline gap-3 leading-none tracking-tighter italic">
                       <span className="text-5xl font-black text-white uppercase tabular-nums">{metric.value}</span>
                       <span className="text-[10px] font-black uppercase text-gray-700 tracking-widest leading-none pt-1">{metric.sub}</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           <div className="lg:col-span-12 xl:col-span-8 space-y-8">
              <div className="flex items-center justify-between px-2">
                 <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] italic">Active Intelligence Nodes</div>
                 <Link to="/saved-reports" className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors italic">See all clusters</Link>
              </div>
              <Card className="bg-gray-900/60 border border-gray-800 rounded-5xl overflow-hidden shadow-2xl backdrop-blur-3xl">
                <CardContent className="p-1">
                  {repoCount === 0 ? (
                    <div className="text-center py-32 space-y-10 group/empty">
                      <div className="relative h-24 w-24 mx-auto">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-1000" />
                        <div className="relative h-24 w-24 rounded-4xl bg-black border border-gray-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <Box className="h-10 w-10 text-gray-700 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Zero <span className="text-gray-600 not-italic">Nodes</span></h3>
                        <p className="text-gray-500 italic text-lg font-medium max-w-xs mx-auto">
                          Initialize a node to generate architectural maps and flow vectors.
                        </p>
                      </div>
                      <Link to="/analysis" className="inline-block">
                        <Button className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl flex items-center gap-4 group/btn italic">
                          Launch Discovery
                          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6">
                       <SavedRepos />
                    </div>
                  )}
                </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-12 xl:col-span-4 space-y-12">
              <div className="space-y-8">
                <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Sequential Ops</div>
                <Card className="bg-gray-900/60 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
                  <CardContent className="p-6 space-y-4">
                    {[
                      { label: "Neural Scan", path: "/analysis", icon: Terminal, color: "text-indigo-400" },
                      { label: "Vector Roadmap", path: "/roadmap", icon: GitBranch, color: "text-purple-400" },
                      { label: "Institutional ROI", path: "/team-analytics", icon: TrendingUp, color: "text-emerald-400" },
                      { label: "Security Audit", path: "/security", icon: ShieldCheck, color: "text-rose-400" }
                    ].map((action, i) => (
                      <Link key={i} to={action.path} className="block group">
                        <div className="flex items-center justify-between p-6 rounded-3xl bg-black/40 border border-transparent hover:border-gray-800 hover:bg-white/5 transition-all duration-300">
                          <div className="flex items-center gap-5">
                             <div className="h-12 w-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/30 transition-all shadow-inner">
                                <action.icon className={`h-5 w-5 ${action.color}`} />
                             </div>
                             <span className="text-sm font-black text-gray-500 group-hover:text-white uppercase tracking-tighter italic transition-colors leading-none">{action.label}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-800 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Telemetry Stats</div>
                <Card className="bg-indigo-600 border-none rounded-5xl shadow-[0_40px_100px_-20px_rgba(79,70,229,0.5)] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-linear-to-br from-indigo-500 to-indigo-800 opacity-90" />
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-white/20 transition-all duration-1000" />
                  
                  <CardContent className="relative p-10 space-y-10">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="h-3 w-3 rounded-full bg-white animate-pulse shadow-[0_0_15px_white]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Active Grid</span>
                       </div>
                       <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-[0.2em] text-white italic">Tier: Pro</div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-white italic font-black uppercase tracking-widest text-[9px]">
                           <span>Resource Bandwidth</span>
                           <span className="text-3xl tabular-nums">
                             {Math.min(100, Math.round((tokenStats.totalTokensUsed / 10000) * 100))}%
                           </span>
                        </div>
                        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <motion.div 
                            className="h-full bg-white shadow-[0_0_15px_white]"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.round((tokenStats.totalTokensUsed / 10000) * 100))}%` }}
                            transition={{ duration: 2, ease: "circOut" }}
                          />
                        </div>
                     </div>

                     <p className="text-sm text-indigo-100/70 font-medium italic leading-relaxed">
                        Compute clusters are performing at nominal levels. Resource scaling is dynamic based on Git repository density and semantic complexity.
                     </p>
                  </CardContent>
                </Card>
              </div>
           </div>
        </div>

        <div className="p-12 md:p-16 rounded-5xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="flex items-center gap-10">
              <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
                 <Sparkles className="h-10 w-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Context Window Strategy</h4>
                 <p className="text-gray-400 font-medium italic text-lg leading-relaxed max-w-xl">
                    Pruning inactive dependency nodes to maximize token yield. Current optimization state: <span className="text-white font-bold italic">NOMINAL</span>.
                 </p>
              </div>
           </div>
           <Link to="/token-economy" className="shrink-0">
              <Button className="h-14 px-10 bg-black border border-gray-800 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-800 hover:text-white transition-all shadow-2xl italic">
                 Manage Economy
              </Button>
           </Link>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Fleet Command Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Suite v3.2.0
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
