import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Trophy, 
  Loader2, 
  Search,
  Zap,
  TrendingUp,
  FolderGit2
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import SavedRepos from "@/components/SavedRepos"
import { getUserTokenStats, getAllUserAnalyses } from "@/lib/db"

interface TokenStats {
  totalTokensUsed: number
  totalCost: number
  analysisCount: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tokenStats, setTokenStats] = useState<TokenStats>({ totalTokensUsed: 0, totalCost: 0, analysisCount: 0 })
  const [repoCount, setRepoCount] = useState(0)
  
  const stats = {
    readinessScore: Math.min(100, repoCount * 15), // Gamification: more repos = higher readiness
    modulesExplored: repoCount,
    totalModules: 0,
    tasksCompleted: 0,
    timeSpent: 0,
    streak: 0,
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        // Fetch token stats and repo count in parallel
        const [stats, analyses] = await Promise.all([
          getUserTokenStats(user.uid),
          getAllUserAnalyses(user.uid)
        ])
        setTokenStats(stats)
        setRepoCount(analyses.length)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.displayName || user?.email || "Developer"}! 
            {repoCount === 0 
              ? " Start analyzing a repository to begin your learning journey."
              : ` You've analyzed ${repoCount} ${repoCount === 1 ? 'repository' : 'repositories'}.`
            }
          </p>
        </div>
        <div className="flex gap-2">
           {stats.timeSpent > 0 && (
             <Badge variant="secondary" className="text-sm py-1 px-3">
               <Clock className="w-3 h-3 mr-2" /> {stats.timeSpent} Hrs Spent
             </Badge>
           )}
           {stats.streak > 0 && (
             <Badge variant="default" className="text-sm py-1 px-3 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0">
               <Flame className="w-3 h-3 mr-2" /> {stats.streak} Day Streak
             </Badge>
           )}
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
            <Card className="relative overflow-hidden">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary to-purple-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.readinessScore}%</div>
                    <p className="text-xs text-muted-foreground">
                      {repoCount > 0 ? "Based on your analyzed repos" : "Track your progress by exploring modules"}
                    </p>
                    <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.readinessScore}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-linear-to-r from-primary to-purple-500" 
                        />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={item}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Repositories Analyzed</CardTitle>
                    <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{repoCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {repoCount > 0 
                        ? `${tokenStats.analysisCount} total analyses` 
                        : "Start analyzing a repo to explore modules"
                      }
                    </p>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Tokens Used</CardTitle>
                    <Zap className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {tokenStats.totalTokensUsed > 0 
                        ? `${(tokenStats.totalTokensUsed / 1000).toFixed(1)}K`
                        : "0"
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tokenStats.totalCost > 0 
                        ? `~$${tokenStats.totalCost.toFixed(4)} estimated cost`
                        : "Token usage will appear here"
                      }
                    </p>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item}>
          <Link to="/analysis">
            <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {repoCount > 0 ? "Analyze More" : "Get Started"}
                    </CardTitle>
                    <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-base font-medium">
                      {repoCount > 0 ? "Add Another Repo" : "Analyze Your First Repo"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {repoCount > 0 ? "Continue building your knowledge" : "Start your onboarding journey"}
                    </p>
                    <div className="mt-3">
                        <Button size="sm" className="gap-2">
                            <TrendingUp className="h-3 w-3" />
                            {repoCount > 0 ? "New Analysis" : "Analyze Repo"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>

      {/* Saved Repositories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-white/10 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" />
                Your Repositories
              </CardTitle>
              <CardDescription>
                All your analyzed codebases in one place
              </CardDescription>
            </div>
            {repoCount > 0 && (
              <Link to="/analysis">
                <Button variant="outline" size="sm" className="gap-2">
                  <Search className="h-3 w-3" />
                  Analyze New
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <SavedRepos />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="col-span-1 border-primary/10 bg-linear-to-br from-card to-card/50">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your learning log will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Circle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start by analyzing a repository</p>
                </div>
            </CardContent>
         </Card>

         <Card className="col-span-1">
             <CardHeader>
                 <CardTitle>Recommended Tasks</CardTitle>
                 <CardDescription>AI-generated tasks will appear here.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Tasks will be generated after repository analysis</p>
                </div>
             </CardContent>
         </Card>
      </div>
    </div>
  )
}
