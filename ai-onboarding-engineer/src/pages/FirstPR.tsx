import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  Clock, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  AlertCircle,
  Loader2
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
  const [error, setError] = useState<string | null>(null)

  const loadDefaultIssues = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get<FirstIssue[]>("/first-pr/issues")
      setIssues(response)
    } catch (error) {
      console.error("Failed to fetch issues:", error)
      setError("Failed to load issues. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRepositoryFirstPRIssues = useCallback(async () => {
    if (!currentRepository || !user) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.post<FirstIssue[]>("/first-pr/generate-from-repo", {
        repo_id: currentRepository.id,
        user_id: user.uid,
      })
      setIssues(response)
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
      setProgress(response.progress)
    } catch (error) {
      console.error("Failed to start issue:", error)
    }
  }

  const completeStep = async (stepNum: number) => {
    if (!activeIssue || !user) return
    try {
      const response = await api.post<{ progress: Progress }>(`/first-pr/progress/${activeIssue.id}/step/${stepNum}?user_id=${user.uid}`, {})
      setProgress(response.progress)
    } catch (error) {
       console.error("Failed to update progress:", error)
    }
  }

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'easy': return 'text-green-500 bg-green-500/10'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10'
      case 'hard': return 'text-red-500 bg-red-500/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  if (error && issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-red-500/10 p-6 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-bold">Cannot Load Issues</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={loadDefaultIssues} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  // Active Issue View
  if (activeIssue && progress) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Button variant="ghost" onClick={() => setActiveIssue(null)} className="mb-6 pl-0 hover:pl-0 hover:underline">
          &larr; Back to Issues
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Rocket className="h-5 w-5 text-primary" />
                     Mission Control: {activeIssue.title}
                  </CardTitle>
                  <CardDescription>
                     Follow these steps to submit your first PR
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  {activeIssue.guidance_steps.map((step, idx) => {
                    const stepNum = idx + 1
                    const isCompleted = progress.completed_steps.includes(stepNum)
                    const isCurrent = progress.current_step === stepNum

                    return (
                      <motion.div 
                        key={idx}
                        initial={false}
                        animate={{ opacity: isCurrent || isCompleted ? 1 : 0.5 }}
                        className={`p-4 rounded-lg border ${
                          isCompleted ? 'bg-green-500/10 border-green-500/20' : 
                          isCurrent ? 'bg-card border-primary shadow-sm' : 'bg-muted/30 border-transparent'
                        }`}
                      >
                         <div className="flex gap-4">
                           <div className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                             isCompleted ? 'bg-green-500 text-white' : 
                             isCurrent ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                           }`}>
                             {isCompleted ? <CheckCircle className="h-4 w-4" /> : stepNum}
                           </div>
                           <div className="flex-1">
                             <p className={`text-sm ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                               {step}
                             </p>
                             {isCurrent && (
                               <Button size="sm" onClick={() => completeStep(stepNum)} className="mt-3">
                                 Mark as Done
                               </Button>
                             )}
                           </div>
                         </div>
                      </motion.div>
                    )
                  })}
               </CardContent>
            </Card>

            {progress.status === 'submitted' && (
               <Card className="bg-green-500/10 border-green-500/20">
                 <CardContent className="flex flex-col items-center py-8">
                    <Rocket className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-xl font-bold text-green-700">Ready for Liftoff! 🚀</h3>
                    <p className="text-center text-green-600 mt-2 max-w-md">
                      Congratulations! You've completed all the steps. Go ahead and submit your PR on GitHub, then paste the link here to claim your points.
                    </p>
                    <Button className="mt-6 bg-green-600 hover:bg-green-700">Submit PR Link</Button>
                 </CardContent>
               </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge variant="outline" className={getDifficultyColor(activeIssue.difficulty)}>
                      {activeIssue.difficulty}
                    </Badge>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Est. time</span>
                    <span className="font-medium">{activeIssue.estimated_hours}h</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Points</span>
                    <span className="font-bold text-primary">+{activeIssue.points} XP</span>
                 </div>
                 <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                       {activeIssue.skills_required.map(skill => (
                         <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                       ))}
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Issues List View
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">First PR Acceleration</h1>
        <p className="text-muted-foreground">
          Guided "Good First Issues" to help you merge your first code contribution in days, not weeks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {issues.map((issue) => (
           <motion.div
             key={issue.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3 }}
           >
             <Card className="h-full flex flex-col hover:border-primary/50 transition-all hover:shadow-lg">
               <CardHeader>
                 <div className="flex justify-between items-start mb-2">
                   <Badge variant="secondary" className="font-normal capitalize">
                     {issue.issue_type.replace('_', ' ')}
                   </Badge>
                   <Badge variant="outline" className={getDifficultyColor(issue.difficulty)}>
                     {issue.difficulty}
                   </Badge>
                 </div>
                 <CardTitle className="text-lg leading-snug">{issue.title}</CardTitle>
               </CardHeader>
               
               <CardContent className="flex-1">
                 <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                   {issue.description}
                 </p>
                 
                 <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {issue.estimated_hours}h
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="h-3 w-3" /> {issue.points} XP
                    </div>
                 </div>

                 <div className="flex flex-wrap gap-1.5">
                    {issue.skills_required.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="outline" className="text-[10px] h-5">
                        {skill}
                      </Badge>
                    ))}
                 </div>
               </CardContent>

               <CardFooter className="pt-0">
                  <Button className="w-full gap-2 group" onClick={() => startIssue(issue)}>
                    Start Mission
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </CardFooter>
             </Card>
           </motion.div>
         ))}
      </div>
    </div>
  )
}
