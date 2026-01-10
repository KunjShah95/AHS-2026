import React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Clock, FileText } from "lucide-react"

// Mock Data
const roadmapSteps = [
  {
    id: 1,
    title: "Environment Setup & Config",
    description: "Understand how the app is configured and built.",
    files: ["package.json", "vite.config.ts", ".env.example"],
    time: "15 min",
    difficulty: "Beginner",
    status: "completed",
  },
  {
    id: 2,
    title: "Project Structure Overview",
    description: "Learn the folder organization and key architectural decisions.",
    files: ["src/components", "src/pages", "src/lib"],
    time: "30 min",
    difficulty: "Beginner",
    status: "current",
  },
  {
    id: 3,
    title: "Authentication Flow",
    description: "Deep dive into how user sessions are managed.",
    files: ["src/auth/AuthProvider.tsx", "src/lib/session.ts"],
    time: "45 min",
    difficulty: "Intermediate",
    status: "locked",
  },
  {
    id: 4,
    title: "Core Data Fetching",
    description: "Understanding API clients and data hooks.",
    files: ["src/api/client.ts", "src/hooks/useData.ts"],
    time: "1 hour",
    difficulty: "Advanced",
    status: "locked",
  },
]

export default function Roadmap() {
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
