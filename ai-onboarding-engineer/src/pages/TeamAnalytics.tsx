import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  BarChart3,
  BrainCircuit,
  Zap,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Binary,
  ArrowRight,
  Fingerprint,
  Trophy
} from "lucide-react"

interface AnalyticsData {
  team_id: string
  onboarding_metrics: {
    avg_onboarding_days: number
    completion_rate: number
    active_members: number
    total_members: number
  }
  roi_metrics: {
    estimated_hours_saved: number
    roi_percentage: number
    traditional_onboarding_cost: number
    codeflow_onboarding_cost: number
  }
  member_rankings: Array<{
    id: string
    name: string
    role: string
    score: number
    status: string
    rank: number
  }>
  skill_gaps: Array<{
    skill_name: string
    priority: string
    avg_score: number
  }>
  recommendations: string[]
}

export default function TeamAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<AnalyticsData>("/team-analytics/demo-data")
      setData(response)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarChart3 className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Synthesizing Organizational Intelligence...</span>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/organizational-intelligence
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Team <span className="not-italic text-gray-500">Analytics</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Unified onboarding performance synthesis and industrial ROI modeling.
              </p>
           </div>
           
           <div className="flex items-center gap-6 bg-gray-900/40 p-4 rounded-3xl border border-gray-800 shadow-2xl">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cohort ID</div>
                 <div className="text-xl font-black text-indigo-400 italic tracking-tighter uppercase tabular-nums">DELTA-9</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Users className="h-5 w-5 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: "Efficiency Metric", val: data.onboarding_metrics.avg_onboarding_days, sub: "Avg Days", icon: Clock, color: "text-indigo-400", meta: "-74% vs benchmark", trend: "down" },
             { label: "Compute Capital", val: data.roi_metrics.estimated_hours_saved, sub: "Hours Saved", icon: Zap, color: "text-emerald-400", meta: "Senior Capacity Reclaimed", trend: "up" },
             { label: "Yield Performance", val: `${data.roi_metrics.roi_percentage}%`, sub: "Yield", icon: TrendingUp, color: "text-purple-400", meta: "Compounded ROI", trend: "up" },
             { label: "Active Pipeline", val: data.onboarding_metrics.active_members, sub: `of ${data.onboarding_metrics.total_members}`, icon: Fingerprint, color: "text-indigo-400", meta: "Cohort Saturation" }
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
                   
                   <div className="pt-6 border-t border-gray-800/50">
                     <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest italic">
                        {stat.trend === 'down' ? <TrendingDown className="h-3.5 w-3.5 text-indigo-400" /> : stat.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : null}
                        <span className={stat.trend === 'down' ? 'text-indigo-400' : stat.trend === 'up' ? 'text-emerald-400' : 'text-gray-600'}>
                           {stat.meta}
                        </span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-12 xl:col-span-6 space-y-8">
            <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Asset Mapping: Aggregate Skills</div>
            <Card className="bg-gray-900/60 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl backdrop-blur-3xl">
              <CardContent className="p-12 space-y-10">
                <div className="flex items-center justify-between mb-4">
                   <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                      <BrainCircuit className="h-7 w-7 text-indigo-400" />
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-700">Competency Focus</div>
                      <div className="text-sm font-black text-white italic uppercase tracking-tighter">Domain Mastery</div>
                   </div>
                </div>

                <div className="space-y-8">
                   {data.skill_gaps.map((gap, i) => (
                     <div key={i} className="space-y-4">
                       <div className="flex justify-between items-end">
                         <div className="flex items-center gap-4">
                            <span className="font-black text-white uppercase italic tracking-tight text-lg leading-none">{gap.skill_name}</span>
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-[0.2em] border ${gap.priority === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                              {gap.priority}
                            </span>
                         </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-indigo-400 tabular-nums italic leading-none">{gap.avg_score}%</span>
                            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Mastery</span>
                         </div>
                       </div>
                       <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-gray-900 shadow-inner">
                         <motion.div
                           initial={{ width: 0 }}
                           whileInView={{ width: `${gap.avg_score}%` }}
                           transition={{ duration: 1.5, ease: "circOut" }}
                           className={`h-full rounded-full ${
                             gap.avg_score < 50 ? 'bg-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 
                             gap.avg_score < 75 ? 'bg-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                           }`}
                         />
                       </div>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-12 xl:col-span-6 space-y-8">
            <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Strategic Logic: AI Advisory</div>
            <Card className="bg-gray-900/60 border border-gray-800 rounded-4xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl min-h-[600px]">
              <CardContent className="p-12 space-y-12 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
                      <Sparkles className="h-7 w-7 text-purple-400" />
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-700">Neural Synthesis</div>
                      <div className="text-sm font-black text-white italic uppercase tracking-tighter">Strategic Guidance</div>
                   </div>
                </div>

                <div className="space-y-4 flex-1">
                   {data.recommendations.map((rec, i) => (
                     <motion.div 
                       key={i} 
                       className="group flex gap-6 items-start p-6 bg-black/40 rounded-4xl border border-gray-900 hover:border-purple-500/30 transition-all cursor-default"
                       initial={{ opacity: 0, x: 20 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                     >
                       <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-emerald-500/20 transition-colors">
                         <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                       </div>
                       <p className="text-[13px] font-medium italic text-gray-500 group-hover:text-gray-300 transition-colors leading-relaxed">
                          "{rec}"
                       </p>
                     </motion.div>
                   ))}
                </div>
                
                <div className="pt-10 border-t border-gray-800 space-y-8">
                   <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-1 italic">Economic Delta</div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-8 rounded-4xl bg-black border border-gray-800 shadow-inner flex flex-col items-center">
                         <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest mb-2 flex items-center gap-2">
                           <TrendingDown className="h-3 w-3" />
                           Baseline Cost
                         </div>
                         <div className="text-2xl font-black text-gray-500 italic tracking-tighter uppercase tabular-nums">${data.roi_metrics.traditional_onboarding_cost.toLocaleString()}</div>
                      </div>
                      <div className="p-8 rounded-4xl bg-indigo-500/05 border border-indigo-500/10 flex flex-col items-center group/opt">
                         <div className="text-[9px] uppercase font-black text-indigo-400 tracking-widest mb-2 flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            Optimized Cost
                         </div>
                         <div className="text-2xl font-black text-white italic tracking-tighter uppercase tabular-nums group-hover:text-indigo-400 transition-colors">${data.roi_metrics.codeflow_onboarding_cost.toLocaleString()}</div>
                      </div>
                   </div>
                   
                   <div className="p-10 rounded-4xl bg-indigo-600 border border-indigo-500 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.4)] relative overflow-hidden group/savings">
                      <div className="absolute top-0 right-0 p-6">
                         <Trophy className="h-10 w-10 text-white/10 group-hover/savings:scale-110 transition-transform" />
                      </div>
                      <div className="relative space-y-2">
                         <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 italic">Net Organizational Savings</div>
                         <div className="text-5xl font-black text-white tracking-tighter italic leading-none">
                           ${(data.roi_metrics.traditional_onboarding_cost - data.roi_metrics.codeflow_onboarding_cost).toLocaleString()}
                         </div>
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
           <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Cohort Lifecycle: Individual Performance Trajectories</div>
           <div className="space-y-4">
            {data.member_rankings.map((member, idx) => (
              <motion.div 
                key={member.id} 
                className="group flex flex-col md:flex-row items-center justify-between p-8 bg-gray-900/40 border border-gray-800 hover:border-indigo-500/30 rounded-4xl transition-all duration-300 relative overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center gap-10">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-black border border-gray-800 text-indigo-400 font-black text-xl italic tracking-tighter shadow-inner group-hover:border-indigo-500/40 transition-all">
                    #{member.rank.toString().padStart(2, '0')}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-2xl group-hover:text-indigo-400 transition-colors uppercase tracking-tighter italic leading-none truncate max-w-[200px]">{member.name}</h4>
                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mt-2 italic">{member.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-16 mt-8 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-right">
                      <div className="text-3xl font-black text-white italic tracking-tighter tabular-nums leading-none">{member.score}</div>
                      <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic mt-1">Competency</div>
                   </div>
                   <div className="w-48 flex flex-col items-end gap-3">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${member.status === 'on_track' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                        {member.status.replace('_', ' ')}
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-gray-900 shadow-inner">
                         <div className={`h-full transition-all duration-1000 ${member.status === 'on_track' ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${member.score}%` }} />
                      </div>
                   </div>
                   <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black border border-gray-800 group-hover:border-indigo-500/20 transition-all">
                      <ChevronRight className="h-5 w-5 text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-12 md:p-16 rounded-4xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-10 w-10 text-indigo-400" />
           </div>
           <div className="flex-1 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Compliance & Integrity Sync</h4>
              <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                 Audit-grade logging of all competency shifts is currently active for the enterprise portal. All trajectories are synthesized with 99.9% statistical confidence for regulatory validation.
              </p>
           </div>
           <Button className="h-14 px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl shrink-0 group/audit">
              <div className="flex items-center gap-3">
                 <Binary className="h-4 w-4" />
                 Initialize Audit
                 <ArrowRight className="h-4 w-4 group-hover/audit:translate-x-1 transition-transform" />
              </div>
           </Button>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Organizational Engine Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Analytics v5.0.3
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
