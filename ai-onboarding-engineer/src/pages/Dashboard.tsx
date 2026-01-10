import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Flame, LayoutDashboard, Trophy } from "lucide-react"

export default function Dashboard() {
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

  return (
    <div className="py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! You're making great progress on <strong>acme/repo</strong>.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="secondary" className="text-sm py-1 px-3">
             <Clock className="w-3 h-3 mr-2" /> 2.5 Hrs Spent
           </Badge>
           <Badge variant="default" className="text-sm py-1 px-3 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0">
             <Flame className="w-3 h-3 mr-2" /> 3 Day Streak
           </Badge>
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
                    <div className="text-2xl font-bold">42%</div>
                    <p className="text-xs text-muted-foreground">+12% from last week</p>
                    <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[42%]" />
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
                    <div className="text-2xl font-bold">5/12</div>
                    <p className="text-xs text-muted-foreground">Understanding Core & Auth</p>
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
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">2 pending review</p>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Next Milestone</CardTitle>
                    <Circle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold truncate">Database Schema</div>
                    <p className="text-xs text-muted-foreground">Estimated: 30 mins</p>
                    <div className="mt-2">
                        <Badge variant="outline" className="text-[10px] h-5">Intermediate</Badge>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="col-span-1 border-primary/10 bg-linear-to-br from-card to-card/50">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your learning log for this repository.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                   <div className="flex">
                       <span className="relative flex h-3 w-3 mt-1 mr-4">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                       </span>
                       <div className="space-y-1">
                           <p className="text-sm font-medium leading-none">Analyzed "Auth Service" module</p>
                           <p className="text-xs text-muted-foreground">10 minutes ago</p>
                       </div>
                   </div>
                   <div className="flex">
                       <span className="flex h-3 w-3 mt-1 mr-4 rounded-full bg-secondary border border-primary/20" />
                       <div className="space-y-1">
                           <p className="text-sm font-medium leading-none">Completed "Environment Setup"</p>
                           <p className="text-xs text-muted-foreground">2 hours ago</p>
                       </div>
                   </div>
                   <div className="flex">
                       <span className="flex h-3 w-3 mt-1 mr-4 rounded-full bg-secondary border border-primary/20" />
                       <div className="space-y-1">
                           <p className="text-sm font-medium leading-none">Started new session</p>
                           <p className="text-xs text-muted-foreground">Yesterday</p>
                       </div>
                   </div>
                </div>
            </CardContent>
         </Card>

         <Card className="col-span-1">
             <CardHeader>
                 <CardTitle>Recommended Tasks</CardTitle>
                 <CardDescription>AI-generated tasks based on your progress.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 {[
                     { title: "Fix a typo in README.md", type: "Good First Issue", time: "5m" },
                     { title: "Add log to Auth Controller", type: "Beginner", time: "15m" },
                     { title: "Update dependency version", type: "Chore", time: "10m" },
                 ].map((t, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{t.title}</p>
                                <p className="text-xs text-muted-foreground">{t.type} • {t.time}</p>
                            </div>
                        </div>
                        <Badge variant="outline">Start</Badge>
                     </div>
                 ))}
             </CardContent>
         </Card>
      </div>
    </div>
  )
}
