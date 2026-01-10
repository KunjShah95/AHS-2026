import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Code, FileCode, GitPullRequest, Play } from "lucide-react"

const tasks = [
  {
    id: 1,
    title: "Update API Base URL",
    description: "The API endpoint has changed. Update the base URL configuration in the environment file and client.",
    difficulty: "Beginner",
    estimatedTime: "10m",
    files: ["src/lib/api.ts", ".env.example"],
    status: "pending", // pending, in-progress, completed
    marketing: "Good First Issue"
  },
  {
    id: 2,
    title: "Add Loading State to Dashboard",
    description: "Users aren't seeing feedback when the dashboard loads. Add a skeleton loader or spinner.",
    difficulty: "Intermediate",
    estimatedTime: "30m",
    files: ["src/pages/Dashboard.tsx", "src/components/ui/skeleton.tsx"],
    status: "pending",
    marketing: "UI Improvement"
  },
  {
    id: 3,
    title: "Fix Typo in Auth Error Message",
    description: "Users report seeing 'Passowrd' instead of 'Password' on login failure.",
    difficulty: "Beginner",
    estimatedTime: "5m",
    files: ["src/auth/AuthProvider.tsx"],
    status: "completed",
    marketing: "Bug Fix"
  }
]

export default function Tasks() {
  const [taskList, setTaskList] = useState(tasks)

  const toggleStatus = (id: number) => {
    setTaskList(taskList.map(t => {
      if (t.id === id) {
        const newStatus = t.status === "completed" ? "pending" : "completed"
        return { ...t, status: newStatus }
      }
      return t
    }))
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
