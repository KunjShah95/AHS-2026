import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function RepoAnalysis() {
  const [repoUrl, setRepoUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const navigate = useNavigate()

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return
    setAnalyzing(true)
    
    // Simulate analysis delay
    setTimeout(() => {
      setAnalyzing(false)
      navigate("/roadmap")
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <Card className="border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Analyze Repository</CardTitle>
            <CardDescription className="text-lg">
              Enter a GitHub URL to generate your personalized learning plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="https://github.com/username/repo" 
                  className="pl-10 h-12 bg-background/50 border-white/10 focus-visible:ring-primary/50 text-base"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold" disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Codebase Structure...
                  </>
                ) : (
                  "Start Analysis"
                )}
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5">React</span>
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5">Node.js</span>
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5">Python</span>
              <span>+ Supported</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
