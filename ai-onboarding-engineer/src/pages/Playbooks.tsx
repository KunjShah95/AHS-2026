import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  Copy,
  Loader2,
  Workflow,
  ChevronRight,
  Sparkles,
  Target,
  Binary
} from "lucide-react"
import { useRepository } from "@/hooks/useRepository"
import { useAuth } from "@/hooks/useAuth"

interface PlaybookPhase {
  phase_number: number
  title: string
  duration_hours: number
  objectives: string[]
}

interface OnboardingPlaybook {
  id: string
  name: string
  description: string
  target_role: string
  total_hours: number
  phases: PlaybookPhase[]
  success_rate: number
  times_used: number
  tags: string[]
  is_template: boolean
  repo_id?: string
}

export default function Playbooks() {
  const { currentRepository } = useRepository()
  const { user } = useAuth()
  const [playbooks, setPlaybooks] = useState<OnboardingPlaybook[]>([])
  const [loading, setLoading] = useState(true)

  const loadDefaultPlaybooks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<OnboardingPlaybook[]>("/playbooks/list")
      setPlaybooks(response)
    } catch (error) {
      console.error("Failed to fetch playbooks:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRepositoryPlaybooks = useCallback(async () => {
    if (!currentRepository || !user) return

    try {
      setLoading(true)
      const response = await api.post<OnboardingPlaybook[]>("/playbooks/generate-from-repo", {
        repo_id: currentRepository.id,
        user_id: user.uid,
      })
      setPlaybooks(response)
    } catch (err) {
      console.error("Failed to fetch repository playbooks:", err)
      loadDefaultPlaybooks()
    } finally {
      setLoading(false)
    }
  }, [currentRepository, user, loadDefaultPlaybooks])

  useEffect(() => {
    if (currentRepository && user) {
      loadRepositoryPlaybooks()
    } else {
      loadDefaultPlaybooks()
    }
  }, [currentRepository, user, loadRepositoryPlaybooks, loadDefaultPlaybooks])

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Phasing Protocol Clusters...</span>
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
                 /ops/onboarding-protocols
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Strategic <span className="not-italic text-gray-500">Playbooks</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Optimized execution pathways synthesized for high-bandwidth engineering cohorts.
              </p>
           </div>
           
           <Button className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3">
              <Sparkles className="h-4 w-4" />
              Blueprint New Path
           </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {playbooks.map((playbook, i) => (
            <motion.div 
               key={playbook.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full flex flex-col bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/40 transition-all">
                <CardHeader className="p-10 pb-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-center">
                            <Workflow className="h-5 w-5 text-indigo-400" />
                         </div>
                         <h3 className="text-3xl font-black uppercase tracking-tighter text-white group-hover:text-indigo-400 transition-colors italic">{playbook.name}</h3>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                        Target Node: {playbook.target_role}
                      </Badge>
                    </div>
                    {playbook.is_template && (
                       <div className="h-10 w-10 rounded-full border border-purple-500/20 bg-purple-500/10 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                         <Star className="h-4 w-4 text-purple-400" />
                       </div>
                    )}
                  </div>
                  <CardDescription className="text-gray-500 font-medium italic text-lg leading-relaxed">
                    {playbook.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-10 flex-1 space-y-10">
                  <div className="grid grid-cols-3 gap-4">
                     <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 text-center space-y-1">
                        <div className="text-2xl font-black text-white tracking-tighter tabular-nums">{playbook.total_hours}h</div>
                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Duration</div>
                     </div>
                     <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 text-center space-y-1">
                        <div className="text-2xl font-black text-white tracking-tighter tabular-nums">{playbook.times_used}</div>
                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Deployments</div>
                     </div>
                     <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 text-center space-y-1">
                        <div className="text-2xl font-black text-emerald-400 tracking-tighter tabular-nums">{playbook.success_rate.toFixed(0)}%</div>
                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Efficiency</div>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic">Execution Phases</div>
                    <div className="space-y-3">
                      {playbook.phases.slice(0, 3).map((phase) => (
                        <div key={phase.phase_number} className="flex items-center gap-6 p-4 rounded-2xl bg-black/40 border border-transparent hover:border-gray-800 transition-all group/phase">
                          <div className="text-xs font-black text-indigo-400 opacity-40 group-hover/phase:opacity-100 transition-opacity tabular-nums">
                            {phase.phase_number.toString().padStart(2, '0')}
                          </div>
                          <div className="h-px flex-1 bg-gray-800/50" />
                          <span className="text-xs font-bold uppercase tracking-tight text-gray-400 group-hover/phase:text-white transition-colors italic">{phase.title}</span>
                        </div>
                      ))}
                      {playbook.phases.length > 3 && (
                        <div className="text-[10px] font-black italic text-gray-700 pl-12">
                           + {playbook.phases.length - 3} additional sequence segments
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap pb-10">
                     {playbook.tags.map(tag => (
                        <Badge key={tag} className="bg-transparent border-gray-800 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:border-gray-700 transition-colors">
                           #{tag}
                        </Badge>
                     ))}
                  </div>
                </CardContent>

                <CardFooter className="p-10 pt-0">
                  <div className="flex w-full gap-4">
                     <Button className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-indigo-500/20 gap-3 group">
                       Initialize Protocol
                       <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                     </Button>
                     <Button variant="outline" className="h-14 w-14 rounded-2xl bg-transparent border-gray-800 hover:bg-white/5 transition-all p-0">
                       <Copy className="h-4 w-4 text-gray-500" />
                     </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {playbooks.length === 0 && !loading && (
          <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-4xl space-y-8">
             <div className="inline-flex h-20 w-20 rounded-4xl bg-indigo-500/10 items-center justify-center border border-indigo-500/20">
                <Target className="h-10 w-10 text-indigo-400" />
             </div>
             <p className="text-gray-500 font-medium text-lg italic">Zero established protocols found for this node cluster.</p>
             <Button className="h-14 px-10 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl">Create Foundation Playbook</Button>
          </div>
        )}

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Strategic Protocols Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Archive v3.1.2
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
