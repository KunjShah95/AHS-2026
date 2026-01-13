import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  Clock, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Loader2,
  ChevronLeft,
  Sparkles,
  Cpu,
  Binary
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRepository } from "@/hooks/useRepository"

interface FirstIssue {
  id: string
  title: string
  description: string
  issue_type: string
  difficulty: string
  estimated_hours: number
  skills_required: string[]
  points: number
  guidance_steps: string[]
  repo_id?: string
}

interface Progress {
  current_step: number
  total_steps: number
  completed_steps: number[]
  status: string
  selected_issue_id: string
}

export default function FirstPR() {
  const { user } = useAuth()
  const { currentRepository } = useRepository()
  const [issues, setIssues] = useState<FirstIssue[]>([])
  const [activeIssue, setActiveIssue] = useState<FirstIssue | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDefaultIssues = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<FirstIssue[]>("/first-pr/issues")
      setIssues(response.data)
    } catch (error) {
      console.error("Failed to fetch issues:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRepositoryFirstPRIssues = useCallback(async () => {
    if (!currentRepository || !user) return

    try {
      setLoading(true)
      const response = await api.post<FirstIssue[]>("/first-pr/generate-from-repo", {
        repo_id: currentRepository.id,
        user_id: user.uid,
      })
      setIssues(response.data)
    } catch (err) {
      console.error("Failed to fetch repository first PR issues:", err)
      loadDefaultIssues()
    } finally {
      setLoading(false)
    }
  }, [currentRepository, user, loadDefaultIssues])

  useEffect(() => {
    if (currentRepository && user) {
      loadRepositoryFirstPRIssues()
    } else {
      loadDefaultIssues()
    }
  }, [currentRepository, user, loadRepositoryFirstPRIssues, loadDefaultIssues])

  const startIssue = async (issue: FirstIssue) => {
    if (!user) return
    try {
      const response = await api.post<{ progress: Progress }>(`/first-pr/start/${issue.id}?user_id=${user.uid}`, {})
      setActiveIssue(issue)
      setProgress(response.data.progress)
    } catch (error) {
      console.error("Failed to start issue:", error)
    }
  }

  const completeStep = async (stepNum: number) => {
    if (!activeIssue || !user) return
    try {
      const response = await api.post<{ progress: Progress }>(`/first-pr/progress/${activeIssue.id}/step/${stepNum}?user_id=${user.uid}`, {})
      setProgress(response.data.progress)
    } catch (error) {
       console.error("Failed to update progress:", error)
    }
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Provisioning Contribution Vectors...</span>
        </div>
    )
  }

  if (activeIssue && progress) {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-6">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto space-y-12 pb-32">
          <Button variant="ghost" onClick={() => setActiveIssue(null)} className="h-12 px-6 rounded-xl bg-gray-900/40 border border-gray-800 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 gap-3 transition-all italic">
            <ChevronLeft className="h-4 w-4" /> Return to Command
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-8">
              <header className="space-y-4">
                 <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Active Mission Cluster
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">{activeIssue.title}</h1>
              </header>

              <div className="space-y-6">
                  {activeIssue.guidance_steps.map((step, idx) => {
                    const stepNum = idx + 1
                    const isCompleted = progress.completed_steps.includes(stepNum)
                    const isCurrent = progress.current_step === stepNum

                    return (
                      <motion.div 
                        key={idx}
                        className={`p-8 rounded-4xl border transition-all ${
                          isCompleted ? 'bg-emerald-500/05 border-emerald-500/20 opacity-60' : 
                          isCurrent ? 'bg-gray-900/40 border-indigo-500/40 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.2)]' : 'bg-black/40 border-gray-900 opacity-40'
                        }`}
                      >
                         <div className="flex gap-8 items-start">
                           <div className={`mt-1 flex items-center justify-center h-10 w-10 rounded-2xl text-[10px] font-black shrink-0 border tabular-nums ${
                             isCompleted ? 'bg-emerald-500 border-emerald-400 text-white' : 
                             isCurrent ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-700'
                           }`}>
                             {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepNum.toString().padStart(2, '0')}
                           </div>
                           <div className="flex-1 space-y-6">
                             <p className={`text-lg italic font-medium leading-relaxed ${isCompleted || isCurrent ? 'text-white' : 'text-gray-700'}`}>
                               {step}
                             </p>
                             {isCurrent && (
                               <Button size="lg" onClick={() => completeStep(stepNum)} className="h-12 px-8 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-200 shadow-2xl transition-all">
                                 Mark Sequence Final
                               </Button>
                             )}
                           </div>
                         </div>
                      </motion.div>
                    )
                  })}
              </div>

              {progress.status === 'submitted' && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-12 rounded-4xl bg-linear-to-br from-emerald-600 to-emerald-900 text-center space-y-8 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.3)]"
                 >
                    <div className="h-20 w-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
                       <Rocket className="h-10 w-10 text-white shadow-2xl" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic">Initial Merge Vector Ready</h3>
                       <p className="text-emerald-100 font-medium italic text-lg max-w-md mx-auto leading-relaxed">
                         Sequence complete. Transition code to GitHub cluster and commit the artifact URL to finalize institutional credits.
                       </p>
                    </div>
                    <Button className="h-16 px-12 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:bg-emerald-50 transition-all">
                       Commit Artifact Link
                    </Button>
                 </motion.div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 px-2 italic">Mission Parameters</div>
              <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden">
                <CardContent className="p-10 space-y-8">
                   <div className="space-y-6">
                      <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Tier</span>
                         <Badge className={`bg-transparent border-none text-right font-black uppercase tracking-widest text-indigo-400 p-0`}>
                           {activeIssue.difficulty}
                         </Badge>
                      </div>
                      <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Timeline</span>
                         <span className="text-lg font-black text-white italic tracking-tighter tabular-nums">{activeIssue.estimated_hours}h</span>
                      </div>
                      <div className="flex justify-between items-center px-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Credits</span>
                         <span className="text-lg font-black text-emerald-400 italic tracking-tighter tabular-nums">+{activeIssue.points} XP</span>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-gray-800 space-y-6">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-2 flex items-center gap-2 italic">
                         <Cpu className="h-3 w-3" />
                         Artifact Proficiency
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {activeIssue.skills_required.map(skill => (
                           <Badge key={skill} className="bg-black/40 border shadow-inner border-gray-800 text-gray-500 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                              {skill}
                           </Badge>
                         ))}
                      </div>
                   </div>
                </CardContent>
              </Card>

              <div className="p-8 rounded-4xl bg-indigo-600/10 border border-indigo-500/20 space-y-4">
                 <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                 </div>
                 <p className="text-xs font-bold text-gray-300 italic leading-relaxed">
                    First PR is your entry vector into the institutional codebase. Focus on small, clinical increments.
                 </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Contribution Stream Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Merge v1.4.2
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
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
                 /ops/first-merge-acceleration
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                First <span className="not-italic text-gray-500">Acceleration</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Guided contribution vectors for rapid institutional assimilation.
              </p>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Pending Clusters</div>
                 <div className="text-2xl font-black text-white tabular-nums tracking-tighter">{issues.length} Nodes</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Binary className="h-6 w-6 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {issues.map((issue, i) => (
             <motion.div
               key={issue.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
             >
               <Card className="h-full flex flex-col bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/40 transition-all shadow-xl">
                 <CardHeader className="p-10 pb-6">
                   <div className="flex justify-between items-start mb-6">
                     <Badge className="bg-black/40 border border-gray-800 text-gray-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic">
                       Cluster: {issue.issue_type.replace('_', ' ')}
                     </Badge>
                     <div className="h-8 w-8 rounded-lg bg-indigo-500/05 border border-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-[10px]">
                       {issue.difficulty[0].toUpperCase()}
                     </div>
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-indigo-400 transition-colors leading-none italic">
                     {issue.title}
                   </h3>
                 </CardHeader>
                 
                 <CardContent className="px-10 flex-1 space-y-8">
                   <p className="text-gray-500 text-sm font-medium italic leading-relaxed line-clamp-3">
                     {issue.description}
                   </p>
                   
                   <div className="flex items-center gap-8 py-6 border-y border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-700" /> 
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 tabular-nums italic">{issue.estimated_hours}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-emerald-400" /> 
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 tabular-nums italic">+{issue.points} XP</span>
                      </div>
                   </div>

                   <div className="flex flex-wrap gap-2 pb-6">
                      {issue.skills_required.slice(0, 3).map(skill => (
                        <div key={skill} className="px-3 py-1 rounded-lg bg-black/40 border border-gray-800 text-gray-500 text-[9px] font-black uppercase tracking-widest italic">
                          {skill}
                        </div>
                      ))}
                   </div>
                 </CardContent>

                 <CardFooter className="p-10 pt-0">
                    <Button className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-4 group" onClick={() => startIssue(issue)}>
                      Initiate Mission
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                 </CardFooter>
               </Card>
             </motion.div>
           ))}
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Contribution Stream Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Merge v1.4.2
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
