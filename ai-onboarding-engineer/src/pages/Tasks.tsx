import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Code, FileCode, GitPullRequest, Play, Loader2, ListTodo } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface Task {
  id: number
  title: string
  description: string
  difficulty: string
  estimatedTime: string
  files: string[]
  status: string
  marketing: string
}

export default function Tasks() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [taskList, setTaskList] = useState<Task[]>([])

  useEffect(() => {
    const loadTasks = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // TODO: Fetch tasks from Firebase for the user's current repository
        // const tasks = await getTasksForUser(user.uid)
        // setTaskList(tasks)
        setLoading(false)
      } catch (error) {
        console.error("Error loading tasks:", error)
        setLoading(false)
      }
    }

    loadTasks()
  }, [user])

  const toggleStatus = (id: number) => {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (taskList.length === 0) {
    return (
      <div className="py-12 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">Practice Tasks</h1>
          <p className="text-muted-foreground">Get hands-on with the codebase through simulated, safe-to-fail tasks.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 border border-border/50 rounded-2xl bg-card/30">
          <ListTodo className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tasks Available</h3>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            Tasks will be generated after you analyze a repository and complete the initial roadmap.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Practice Tasks</h1>
        <p className="text-muted-foreground">Get hands-on with the codebase through simulated, safe-to-fail tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {taskList.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`transition-all ${task.status === "completed" ? "bg-secondary/30 border-primary/20" : "bg-card border-white/10"}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className={`flex items-center gap-2 text-xl ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                      {task.title}
                    </CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  <Badge variant={task.difficulty === "Beginner" ? "secondary" : "default"}>
                    {task.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span>Estimated: {task.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4" />
                    <span>{task.marketing}</span>
                  </div>
                </div>

                <div className="bg-secondary/50 p-3 rounded-lg border border-white/5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Relevant Files</span>
                  <div className="flex flex-wrap gap-2">
                    {task.files.map(file => (
                      <div key={file} className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-white/5 text-xs font-mono">
                        <FileCode className="w-3 h-3 text-primary" />
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-white/5 pt-6">
                <Button variant="outline" size="sm" asChild>
                   <a href="#" className="flex items-center gap-2">
                     <Play className="w-3 h-3" /> Start Task (IDE)
                   </a>
                </Button>
                <Button 
                  variant={task.status === "completed" ? "secondary" : "default"} 
                  size="sm"
                  onClick={() => toggleStatus(task.id)}
                  className="flex items-center gap-2"
                >
                  {task.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  {task.status === "completed" ? "Completed" : "Mark Complete"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
