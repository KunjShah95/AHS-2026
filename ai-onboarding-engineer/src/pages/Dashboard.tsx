import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Flame, LayoutDashboard, Trophy, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  // TODO: This will become useState when Firebase integration is complete
  const stats = {
    readinessScore: 0,
    modulesExplored: 0,
    totalModules: 0,
    tasksCompleted: 0,
    timeSpent: 0,
    streak: 0,
  }

  useEffect(() => {
    // TODO: Fetch user's dashboard data from Firebase
    // For now, show empty state
    const fetchDashboardData = async () => {
      if (!user) return
      
      try {
        // const data = await getUserDashboardData(user.uid)
        // setStats(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
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
            Welcome back, {user?.displayName || user?.email || "Developer"}! Start analyzing a repository to begin your learning journey.
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.readinessScore}%</div>
                    <p className="text-xs text-muted-foreground">Track your progress by exploring modules</p>
                    <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${stats.readinessScore}%` }} />
                    </div>
                </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={item}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Modules Explored</CardTitle>
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.modulesExplored}/{stats.totalModules || "—"}</div>
                    <p className="text-xs text-muted-foreground">Start analyzing a repo to explore modules</p>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
                    <p className="text-xs text-muted-foreground">Complete tasks to build expertise</p>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Get Started</CardTitle>
                    <Circle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-base font-medium">Analyze Your First Repo</div>
                    <p className="text-xs text-muted-foreground mt-1">Start your onboarding journey</p>
                    <div className="mt-2">
                        <Badge variant="outline" className="text-[10px] h-5">Ready to Start</Badge>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
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
