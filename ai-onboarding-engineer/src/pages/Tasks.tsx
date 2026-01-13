import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, FileCode, GitPullRequest, Play, Loader2, ListTodo, Terminal, Box, Clock, Binary } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentRepositoryData } from "@/hooks/useRepository"
import { geminiService } from "@/lib/services/gemini-service"
import { getOnboardingTasks, saveOnboardingTasks } from "@/lib/advanced-features-db"
import type { OnboardingTask } from "@/lib/types/advanced-features"

export default function Tasks() {
  const { user } = useAuth()
  const { analysisData, repoId } = useCurrentRepositoryData()
  const [loading, setLoading] = useState(true)
  const [taskList, setTaskList] = useState<OnboardingTask[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTasks = async () => {
      if (!user || !repoId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // 1. Try to load from DB
        const savedTasks = await getOnboardingTasks(repoId)
        
        if (savedTasks.length > 0) {
          setTaskList(savedTasks)
        } else if (analysisData) {
          // 2. If not found, generate using Gemini
          const generatedTasks = await geminiService.generateOnboardingTasks(
            JSON.stringify(analysisData), 
            "mid", 
            "general", 
            "medium"
          )
          
          // Map to OnboardingTask
          const newTasks: OnboardingTask[] = generatedTasks.map((t, i) => ({
            id: `task_${Date.now()}_${i}`,
            repoId,
            title: t.title as string || `Task ${i + 1}`,
            description: t.description as string || "No description provided",
            difficulty: (t.difficulty as string) || "Medium",
            estimatedTime: (t.estimatedTime as string) || "1h",
            files: (Array.isArray(t.filesInvolved) ? t.filesInvolved : []) as string[],
            status: 'pending',
            marketing: "Contribution Yield",
            objective: t.objective as string || "",
            prerequisites: t.prerequisites as string || "",
            steps: JSON.stringify(t.steps || []),
            successCriteria: t.successCriteria as string || "",
            generatedAt: new Date().toISOString()
          }))

          setTaskList(newTasks)
          await saveOnboardingTasks(repoId, newTasks)
        }
      } catch (error) {
        console.error("Error loading tasks:", error)
        setError("Failed to load tasks sequence.")
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [user, repoId, analysisData])

  const toggleStatus = (id: string) => {
    // In a real app we'd save this status change to DB
    setTaskList(taskList.map(t => {
      if (t.id === id) {
        const newStatus = t.status === "completed" ? "pending" : "completed"
        return { ...t, status: newStatus }
      }
      return t
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Provisioning Task Clusters...</span>
      </div>
    )
  }

  if (taskList.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
        <div className="relative z-10 max-w-2xl text-center space-y-12">
           <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
              /dev/assignments
           </div>
           
           <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
                Active <span className="not-italic text-gray-400">Objectives</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium italic max-w-lg mx-auto leading-relaxed">
                Hands-on sequence vectors for low-risk architectural contribution.
              </p>
           </div>

           <div className="py-24 border-2 border-dashed border-gray-800 rounded-4xl bg-gray-900/20 space-y-8 group hover:border-indigo-500/20 transition-all">
              <div className="inline-flex h-20 w-20 rounded-4xl bg-black/40 items-center justify-center border border-gray-800 group-hover:scale-110 transition-transform">
                 <Box className="h-10 w-10 text-gray-600" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold uppercase tracking-tight text-white">Objective Pool Empty</h3>
                 <p className="text-sm text-gray-600 font-medium italic max-w-sm mx-auto leading-relaxed">
                   {error || "Neural scan of the core repository cluster is required to synthesize safe-to-fail practice objectives."}
                 </p>
              </div>
              {!analysisData && (
                <Button size="lg" className="h-14 px-10 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 shadow-2xl transition-all">Initialize System Scan</Button>
              )}
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /ops/active-assignments
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Practice <span className="not-italic text-gray-500">Objectives</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Calibrated micro-contributions designed to reclaim institutional velocity.
              </p>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Active Pool</div>
                 <div className="text-2xl font-black text-white tabular-nums tracking-tighter">{taskList.filter(t => t.status !== 'completed').length} Nodes</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <ListTodo className="h-6 w-6 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {taskList.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`group relative h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden transition-all hover:border-indigo-500/30 ${task.status === "completed" ? "bg-black/40 opacity-60" : ""}`}>
                <CardHeader className="p-10 pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                         <div className={`h-10 w-10 rounded-xl bg-black/40 border flex items-center justify-center transition-colors ${task.status === 'completed' ? 'border-emerald-500/20' : 'border-gray-800 group-hover:border-indigo-500/40'}`}>
                            {task.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Terminal className="h-5 w-5 text-gray-600" />}
                         </div>
                         <CardTitle className={`text-2xl font-black uppercase tracking-tighter ${task.status === "completed" ? "text-gray-500 line-through" : "text-white group-hover:text-indigo-400 transition-colors"} italic`}>
                           {task.title}
                         </CardTitle>
                      </div>
                      <CardDescription className="text-gray-500 font-medium italic text-lg leading-relaxed">
                         {task.description}
                      </CardDescription>
                    </div>
                    <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${task.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>
                      Tier: {task.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-10 space-y-8">
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-700" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Estimate: <span className="text-gray-400 tabular-nums">{task.estimatedTime}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GitPullRequest className="w-4 h-4 text-gray-700" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Yield: <span className="text-indigo-400">{task.marketing}</span></span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-black/40 border border-gray-800 space-y-4">
                    <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] italic">Artifact Cluster Targets</div>
                    <div className="flex flex-wrap gap-2">
                      {task.files.map(file => (
                        <div key={file} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-500 hover:text-indigo-300 hover:border-indigo-500/20 transition-all cursor-default">
                          <FileCode className="w-3 h-3 text-indigo-500/40" />
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-10 pt-0 flex flex-col sm:flex-row gap-4">
                  <Button variant="ghost" className="flex-1 h-16 rounded-xl bg-black/40 border border-gray-800 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 gap-4 group transition-all" asChild>
                     <a href="#" className="flex items-center justify-center">
                       <Play className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> Engage Environment (IDE)
                     </a>
                  </Button>
                  <Button 
                    variant="ghost"
                    className={`h-16 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${task.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white text-black border-white hover:bg-gray-200"}`}
                    onClick={() => toggleStatus(task.id)}
                  >
                    {task.status === "completed" ? "Protocol Confirmed" : "Mark Sequence Final"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Objective Flow Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Queue v2.0.1
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
