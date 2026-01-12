import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Search, 
  Sparkles, 
  ArrowRight,
  Zap,
  Binary,
  Compass,
  Layers
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getUserLatestRoadmap } from "@/lib/db"

interface LearningNode {
  id: string
  concept_name: string
  difficulty: number
  cognitive_load: number
  description: string
  related_code_nodes: string[]
}

interface LearningPath {
  nodes: LearningNode[]
  edges: { source: string; target: string; type: string }[]
  entry_points: string[]
}

interface AnalysisData {
  status: string
  agents_involved?: string[]
  data?: {
    file_tree: { path: string; language: string; type: string }[]
    code_graph: { nodes: unknown[]; edges: unknown[] }
    learning_path: LearningPath
    tasks: { id: string; title: string; description: string; type: string; difficulty: number }[]
  }
  learning_path?: LearningPath
}

interface RoadmapStep {
  id: number
  title: string
  description: string
  files: string[]
  time: string
  difficulty: string
  status: string
}

const estimateTime = (difficulty: number, cognitiveLoad: number): string => {
  const baseMinutes = 15
  const minutes = baseMinutes + difficulty * 10 + cognitiveLoad * 5
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60 * 10) / 10
  return `${hours} hr`
}

const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 2) return "Beginner"
  if (difficulty <= 4) return "Easy"
  if (difficulty <= 6) return "Intermediate"
  if (difficulty <= 8) return "Advanced"
  return "Expert"
}

export default function Roadmap() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([])
  const [repoName, setRepoName] = useState<string>("")

  const parseAnalysisToRoadmap = useCallback((analysisData: AnalysisData): RoadmapStep[] => {
    const learningPath = analysisData.data?.learning_path || analysisData.learning_path
    
    if (!learningPath || !learningPath.nodes || learningPath.nodes.length === 0) {
      return []
    }

    const sortedNodes = [...learningPath.nodes].sort((a, b) => {
      const aIsEntry = learningPath.entry_points?.includes(a.id) ? 0 : 1
      const bIsEntry = learningPath.entry_points?.includes(b.id) ? 0 : 1
      if (aIsEntry !== bIsEntry) return aIsEntry - bIsEntry
      return a.difficulty - b.difficulty
    })

    return sortedNodes.map((node, index) => ({
      id: index + 1,
      title: node.concept_name || `Module ${index + 1}`,
      description: node.description || "Explore this module to understand its functionality.",
      files: node.related_code_nodes || [],
      time: estimateTime(node.difficulty, node.cognitive_load),
      difficulty: getDifficultyLabel(node.difficulty),
      status: index === 0 ? "current" : "pending"
    }))
  }, [])

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const analysisData = location.state?.analysisData as AnalysisData | undefined

        if (analysisData) {
          const steps = parseAnalysisToRoadmap(analysisData)
          setRoadmapSteps(steps)
          const repoUrl = location.state?.repoUrl as string | undefined
          if (repoUrl) {
            const name = repoUrl.split('/').pop()?.replace('.git', '') || 'Repository'
            setRepoName(name)
          }
        } else {
          const savedRoadmap = await getUserLatestRoadmap(user.uid)
          if (savedRoadmap) {
            const steps = parseAnalysisToRoadmap(savedRoadmap.data as unknown as AnalysisData)
            setRoadmapSteps(steps)
            const repoUrl = savedRoadmap.repoUrl
            if (repoUrl) {
              const name = repoUrl.split('/').pop()?.replace('.git', '') || 'Repository'
              setRepoName(name)
            }
          }
        }
        setLoading(false)
      } catch (error) {
        console.error("Error loading roadmap:", error)
        setLoading(false)
      }
    }
    loadRoadmap()
  }, [user, location.state, parseAnalysisToRoadmap])

  const completionPercentage = useMemo(() => {
    if (roadmapSteps.length === 0) return 0;
    const completedCount = roadmapSteps.filter(s => s.status === 'completed').length;
    return Math.round((completedCount / roadmapSteps.length) * 100);
  }, [roadmapSteps]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-[10px] italic">Synthesizing Learning Path...</span>
      </div>
    )
  }

  if (roadmapSteps.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-6 flex items-center justify-center overflow-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
        <div className="max-w-md text-center space-y-12 relative z-10">
           <div className="h-24 w-24 rounded-4xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto shadow-2xl group hover:border-indigo-500/40 transition-all">
              <Compass className="h-10 w-10 text-gray-700 group-hover:text-indigo-400 transition-colors" />
           </div>
           <div className="space-y-4">
              <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Zero <span className="text-gray-600 not-italic">Trajectory</span></h3>
              <p className="text-gray-500 font-medium italic text-lg leading-relaxed">Initialize repository analysis to generate a personalized learning roadmap.</p>
           </div>
           <Link to="/analysis" className="inline-block">
             <Button className="h-16 px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl italic group">
                <Search className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                Analyze Repository
             </Button>
           </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto space-y-16 pb-32">
        <header className="text-center space-y-6 pb-12 border-b border-gray-900">
           <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
              /archive/learning-vectors
           </div>
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
             Learning <span className="not-italic text-gray-500">Roadmap</span>
           </h1>
           {repoName && (
             <div className="flex items-center justify-center gap-3 bg-indigo-500/05 border border-indigo-500/10 w-fit mx-auto px-4 py-2 rounded-xl">
               <Sparkles className="h-4 w-4 text-indigo-400" />
               <span className="font-black text-[10px] uppercase tracking-widest text-indigo-300 italic">{repoName}</span>
             </div>
           )}
           <p className="text-xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
             A deterministic step-by-step traversal path designed to achieve full codebase mastery in record cycles.
           </p>
        </header>

        <div className="relative pl-12 md:pl-0">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-indigo-500/60 via-gray-800 to-transparent md:-translate-x-px" />

          <div className="space-y-24">
            {roadmapSteps.map((step, index) => {
              const isEven = index % 2 === 0
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className={`absolute left-[-42px] md:left-1/2 top-0 h-10 w-10 rounded-2xl border-4 border-black z-20 flex items-center justify-center md:-translate-x-5 shadow-2xl transition-all duration-500 ${
                    step.status === "current" 
                      ? "bg-white text-black scale-110 shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                      : step.status === "completed"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-900 text-gray-700 border-gray-800"
                  }`}>
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-[10px] font-black italic tracking-tighter tabular-nums">{step.id.toString().padStart(2, '0')}</span>
                    )}
                  </div>

                  <div className={`w-full md:w-[45%] ${isEven ? 'md:pl-20' : 'md:pr-20'}`}>
                    <Card className={`group bg-gray-900/40 border-2 transition-all duration-500 rounded-4xl overflow-hidden ${
                      step.status === "current" 
                        ? 'border-indigo-500/60 bg-indigo-500/05 shadow-[0_30px_60px_-20px_rgba(79,70,229,0.2)]' 
                        : 'border-gray-900 hover:border-gray-800'
                    }`}>
                      <CardContent className="p-10">
                        <div className="flex flex-col gap-6 mb-8">
                           <div className="flex items-center justify-between">
                              <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border italic ${
                                step.difficulty === "Beginner" ? "bg-emerald-500/05 border-emerald-500/20 text-emerald-500" :
                                step.difficulty === "Intermediate" ? "bg-amber-500/05 border-amber-500/20 text-amber-500" :
                                "bg-purple-500/05 border-purple-500/20 text-purple-500"
                              }`}>
                                {step.difficulty}
                              </div>
                              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-700 tracking-widest bg-black/40 px-3 py-1 rounded-full border border-gray-900 shadow-inner italic tabular-nums">
                                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                {step.time}
                              </div>
                           </div>
                           <div className="space-y-2">
                             {step.status === "current" && (
                               <div className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.4em] italic mb-1">Active Vector</div>
                             )}
                             <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter leading-none">
                               {step.title}
                             </h3>
                           </div>
                        </div>

                        <p className="text-sm font-medium italic leading-relaxed text-gray-500 mb-10">
                          {step.description}
                        </p>

                        <div className="space-y-6 pt-8 border-t border-gray-800/50">
                          <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] px-1 italic">Genetic Code Entities</div>
                          <div className="flex flex-wrap gap-2">
                            {step.files.slice(0, 4).map(file => (
                              <div key={file} className="px-3 py-1.5 rounded-xl bg-black border border-gray-900 group/file cursor-default hover:border-indigo-500/30 transition-all">
                                <code className="text-[10px] font-mono text-gray-600 group-hover/file:text-indigo-400 transition-colors">
                                  {file.split('/').pop()}
                                </code>
                              </div>
                            ))}
                            {step.files.length > 4 && (
                              <div className="px-3 py-1.5 rounded-xl bg-black/40 text-[9px] font-black text-gray-800 uppercase tracking-widest self-center border border-dashed border-gray-900 tabular-nums">+{step.files.length - 4} more</div>
                            )}
                          </div>
                        </div>

                        <Link to={`/learn/${step.id}`} className="block mt-10">
                          <Button className={`w-full h-14 group/btn rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 italic ${
                            step.status === "current" ? "bg-white text-black hover:bg-gray-200" : "bg-black border border-gray-800 text-gray-600 hover:text-white hover:border-gray-500"
                          }`}>
                            {step.status === "completed" ? "Review Module" : "Start Traversal"}
                            <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="mt-32 p-12 md:p-16 rounded-5xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           
           <div className="relative w-40 h-40 shrink-0">
             <svg className="w-full h-full -rotate-90">
               <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-900" />
               <motion.circle 
                 cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                 className="text-indigo-500"
                 strokeDasharray={440}
                 initial={{ strokeDashoffset: 440 }}
                 animate={{ strokeDashoffset: 440 - (440 * completionPercentage) / 100 }}
                 transition={{ duration: 2, ease: "circOut" }}
                 strokeLinecap="round"
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white italic tracking-tighter leading-none tabular-nums">{completionPercentage}%</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-1 italic">Resolved</div>
             </div>
           </div>

           <div className="flex-1 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Onboarding Milestones</h4>
              <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                 Progress synthesis identifies <span className="text-white font-bold">Architecture Specialist</span> status as imminent. Complete the remaining core vectors to unlock professional-tier validation.
              </p>
              <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                 {['API Patterns', 'Data Relativity', 'State Integrity'].map((tag, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-800 bg-black/40 text-[9px] font-black uppercase tracking-widest italic ${i === 0 ? 'text-indigo-400 border-indigo-500/20' : 'text-gray-600'}`}>
                       {i === 0 ? <Zap className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                       {tag}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Trajectory Engine Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Vectors v2.0.1
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
