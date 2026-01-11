import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Clock, FileText, Loader2, BookOpen, Search, Badge } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { getUserLatestRoadmap } from "@/lib/db"

// Backend API response types
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
  // Legacy format support
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

// Helper function to estimate time based on difficulty
const estimateTime = (difficulty: number, cognitiveLoad: number): string => {
  const baseMinutes = 15
  const minutes = baseMinutes + difficulty * 10 + cognitiveLoad * 5
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60 * 10) / 10
  return `${hours} hr`
}

// Helper function to get difficulty label
const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 2) return "Beginner"
  if (difficulty <= 4) return "Easy"
  if (difficulty <= 6) return "Intermediate"
  if (difficulty <= 8) return "Advanced"
  return "Expert"
}

// Parse the backend learning path into roadmap steps
const parseAnalysisToRoadmap = (analysisData: AnalysisData): RoadmapStep[] => {
  // Handle both new format (data.learning_path) and legacy format (learning_path)
  const learningPath = analysisData.data?.learning_path || analysisData.learning_path
  
  if (!learningPath || !learningPath.nodes || learningPath.nodes.length === 0) {
    return []
  }

  // Sort nodes by difficulty (beginner-friendly first)
  const sortedNodes = [...learningPath.nodes].sort((a, b) => {
    // Entry points come first
    const aIsEntry = learningPath.entry_points?.includes(a.id) ? 0 : 1
    const bIsEntry = learningPath.entry_points?.includes(b.id) ? 0 : 1
    if (aIsEntry !== bIsEntry) return aIsEntry - bIsEntry
    
    // Then sort by difficulty
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
}

export default function Roadmap() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([])
  const [repoName, setRepoName] = useState<string>("")

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Check if we have analysis data from navigation state
        const analysisData = location.state?.analysisData as AnalysisData | undefined

        if (analysisData) {
          // Parse the analysis data into roadmap steps
          const steps = parseAnalysisToRoadmap(analysisData)
          setRoadmapSteps(steps)
          
          // Try to extract repo name from state
          const repoUrl = location.state?.repoUrl as string | undefined
          if (repoUrl) {
            const name = repoUrl.split('/').pop()?.replace('.git', '') || 'Repository'
            setRepoName(name)
          }
        } else {
          // Fetch the latest roadmap from Firebase
          const savedRoadmap = await getUserLatestRoadmap(user.uid)
          if (savedRoadmap) {
            const steps = parseAnalysisToRoadmap(savedRoadmap.data as unknown as AnalysisData)
            setRoadmapSteps(steps)
            
            // Extract repo name from saved data
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
          <p className="text-sm text-muted-foreground max-w-md text-center mb-6">
            Analyze a repository first to generate your personalized learning roadmap.
          </p>
          <Link to="/analysis">
            <Button className="gap-2">
              <Search className="h-4 w-4" />
              Analyze Repository
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Learning Roadmap</h1>
        {repoName && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-3">
            <Badge className="h-3 w-3" />
            {repoName}
          </div>
        )}
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
