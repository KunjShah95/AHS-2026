import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Clock, FileText, Loader2, BookOpen } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useLocation } from "react-router-dom"

interface RoadmapStep {
  id: number
  title: string
  description: string
  files: string[]
  time: string
  difficulty: string
  status: string
}

export default function Roadmap() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([])

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Check if we have analysis data from navigation state
        const analysisData = location.state?.analysisData

        if (analysisData) {
          // TODO: Parse analysisData and generate roadmap steps
          // For now, show empty state
          setRoadmapSteps([])
        } else {
          // TODO: Fetch roadmap from Firebase for the user's current repository
          // const roadmap = await getRoadmapForUser(user.uid)
          // setRoadmapSteps(roadmap)
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Error loading roadmap:", error)
        setLoading(false)
      }
    }

    loadRoadmap()
  }, [user, location.state])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (roadmapSteps.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Learning Roadmap</h1>
          <p className="text-muted-foreground">Your personalized path to mastering this codebase.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 border border-border/50 rounded-2xl bg-card/30">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Roadmap Available</h3>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            Analyze a repository first to generate your personalized learning roadmap.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Learning Roadmap</h1>
        <p className="text-muted-foreground">Your personalized path to mastering this codebase.</p>
      </div>

      <div className="relative border-l border-white/10 pl-8 ml-4 space-y-12">
        {roadmapSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background ${
              step.status === "completed" ? "border-primary text-primary" : 
              step.status === "current" ? "border-primary text-primary ring-4 ring-primary/20" : 
              "border-muted text-muted-foreground"
            }`}>
              {step.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </div>

            <div className={`rounded-xl border p-6 transition-all hover:border-primary/50 ${
              step.status === "current" ? "bg-card border-primary/50 shadow-lg shadow-primary/5" : 
              step.status === "locked" ? "bg-card/40 opacity-70 border-white/5" : "bg-card border-white/10"
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {step.title}
                    {step.status === "current" && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Current</span>}
                  </h3>
                  <p className="text-muted-foreground mt-1">{step.description}</p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1 bg-secondary/50 px-2 py-1 rounded">
                  <Clock className="h-3 w-3" /> {step.time}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Key Files:
                </div>
                <div className="flex flex-wrap gap-2">
                  {step.files.map(file => (
                    <code key={file} className="px-2 py-1 rounded bg-secondary text-xs font-mono text-secondary-foreground">
                      {file}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
