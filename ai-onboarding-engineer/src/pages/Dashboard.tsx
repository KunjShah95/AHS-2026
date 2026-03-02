import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Terminal, 
  GitBranch, 
  Zap,
  TrendingUp,
  FolderGit2,
  ArrowRight,
  Activity,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Box,
  Binary,
  Play
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
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
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
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
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const metrics = [
    {
      label: "Node Population",
      value: repoCount.toString(),
      sub: repoCount > 0 ? "Active Nodes" : "Awaiting Init",
      icon: FolderGit2,
      color: "text-cyan-400"
    },
    {
      label: "Analysis Cycles",
      value: tokenStats.analysisCount.toString(),
      sub: "Lifetime Exec",
      icon: RefreshCw,
      color: "text-teal-400"
    },
    {
      label: "Compute Volume",
      value: tokenStats.totalTokensUsed > 0 
        ? `${(tokenStats.totalTokensUsed / 1000).toFixed(1)}K`
        : "0",
      sub: tokenStats.totalCost > 0 
        ? `$${tokenStats.totalCost.toFixed(3)}`
        : "$0.00",
      icon: Zap,
      color: "text-emerald-400"
    },
    {
      label: "Strategic Readiness",
      value: `${Math.min(100, repoCount * 15)}%`,
      sub: "Institutional coverage",
      icon: TrendingUp,
      color: "text-cyan-400"
    },
  ]

  const quickActions = [
    { label: "Neural Scan", path: "/analysis", icon: Terminal, color: "text-cyan-400" },
    { label: "Vector Roadmap", path: "/roadmap", icon: GitBranch, color: "text-teal-400" },
    { label: "Team Analytics", path: "/team-analytics", icon: TrendingUp, color: "text-emerald-400" },
    { label: "Security Audit", path: "/security", icon: ShieldCheck, color: "text-rose-400" }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Activity className="h-10 w-10 text-primary" />
        </motion.div>
        <span className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Initializing system...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 md:px-8">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-8">
        {/* Header */}
        <motion.header 
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-4">
            <Badge variant="accent" className="w-fit">
              <Terminal className="h-3 w-3" />
              Fleet Command Suite
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-foreground">System</span>
              {" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {user?.email || "developer@codeflow.sh"}
            </p>
          </div>
          
          <Link to="/analysis" className="shrink-0">
            <Button 
              size="xl"
              className="h-14 px-10 font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-1 group"
            >
              <Play className="h-4 w-4" />
              Start Discovery
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {metrics.map((metric, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <Card variant="glow" className="h-full p-6 md:p-8 group hover:scale-105 transition-transform">
                <motion.div 
                  className="flex items-start justify-between mb-8"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <metric.icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{metric.label}</span>
                </motion.div>
                <div className="space-y-2">
                  <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {metric.sub}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Repositories Section */}
          <motion.div 
            className="lg:col-span-12 xl:col-span-8 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest">Active Intelligence Nodes</h2>
              <Link to="/saved-reports" className="text-xs font-bold text-primary uppercase tracking-wider hover:text-accent transition-colors">
                View all →
              </Link>
            </div>
            
            <Card variant="default" className="rounded-2xl overflow-hidden shadow-card-elevated">
              <CardContent className="p-1">
                {repoCount === 0 ? (
                  <motion.div 
                    className="text-center py-24 md:py-32 space-y-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div 
                      className="relative h-24 w-24 mx-auto"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                      <div className="relative h-24 w-24 rounded-xl bg-card border border-border flex items-center justify-center shadow-inner">
                        <Box className="h-10 w-10 text-muted-foreground" />
                      </div>
                    </motion.div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-foreground uppercase tracking-tight">No Nodes Active</h3>
                      <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                        Initialize your first node to generate architectural maps and insights.
                      </p>
                    </div>
                    <Link to="/analysis">
                      <Button className="h-12 px-8 font-bold uppercase">
                        <Play className="h-4 w-4" />
                        Launch Discovery
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  <div className="p-6">
                    <SavedRepos />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div 
            className="lg:col-span-12 xl:col-span-4 space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-2">Quick Actions</h2>
              <Card variant="default" className="rounded-2xl overflow-hidden">
                <CardContent className="p-2 space-y-2">
                  {quickActions.map((action, i) => (
                    <Link key={i} to={action.path}>
                      <motion.button
                        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/10 transition-all duration-200 group text-left"
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <action.icon className={`h-5 w-5 ${action.color}`} />
                          </div>
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors uppercase tracking-wide">
                            {action.label}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </motion.button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Telemetry Stats */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-2">Resource Telemetry</h2>
              <Card variant="glow" className="bg-gradient-to-br from-primary/10 to-accent/5 rounded-2xl overflow-hidden relative">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Grid</span>
                    </div>
                    <Badge variant="accent" size="sm">Premium</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-bold text-foreground uppercase tracking-wider">
                      <span>Bandwidth Usage</span>
                      <span className="text-2xl tabular-nums">
                        {Math.min(100, Math.round((tokenStats.totalTokensUsed / 10000) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-primary/20">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/50"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.round((tokenStats.totalTokensUsed / 10000) * 100))}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    System running at optimal capacity. Dynamic scaling enabled for repository density analysis.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Notice */}
            <Card className="bg-accent/5 border border-accent/20 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                  <div className="space-y-2 flex-1">
                    <h4 className="font-bold text-sm text-foreground">Optimization Status</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Context window is actively pruning inactive nodes to maximize token efficiency.
                    </p>
                  </div>
                </div>
                <Link to="/token-economy">
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Manage →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
