import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  BarChart3,
  BrainCircuit,
  Target,
  Award
} from "lucide-react"

interface AnalyticsData {
  team_id: string
  onboarding_metrics: {
    avg_onboarding_days: number
    completion_rate: number
    active_members: number
    total_members: number
  }
  roi_metrics: {
    estimated_hours_saved: number
    roi_percentage: number
    traditional_onboarding_cost: number
    codeflow_onboarding_cost: number
  }
  member_rankings: Array<{
    id: string
    name: string
    role: string
    score: number
    status: string
    rank: number
  }>
  skill_gaps: Array<{
    skill_name: string
    priority: string
    avg_score: number
  }>
  recommendations: string[]
}

export default function TeamAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<AnalyticsData>("/team-analytics/demo-data")
        setData(response)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Team Analytics</h1>
        <p className="text-muted-foreground">
          Enterprise-grade insights into your engineering team's onboarding performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Onboarding Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.onboarding_metrics.avg_onboarding_days} Days</div>
            <p className="text-xs text-muted-foreground">
              vs 90 days traditional avg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Hours Saved</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{data.roi_metrics.estimated_hours_saved}h</div>
            <p className="text-xs text-muted-foreground">
              Senior developer time saved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{data.roi_metrics.roi_percentage}%</div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.onboarding_metrics.active_members}/{data.onboarding_metrics.total_members}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently onboarding
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Skill Gap Analysis
            </CardTitle>
            <CardDescription>
              Identified knowledge gaps across your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.skill_gaps.map((gap, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{gap.skill_name}</span>
                  <Badge variant={gap.priority === 'critical' ? 'destructive' : 'secondary'}>
                    {gap.priority}
                  </Badge>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gap.avg_score}%` }}
                    className={`h-full rounded-full ${
                      gap.avg_score < 50 ? 'bg-red-500' : 
                      gap.avg_score < 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  Avg Score: {gap.avg_score}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Target className="h-5 w-5 text-primary" />
               AI Recommendations
            </CardTitle>
            <CardDescription>
              Actionable insights to improve onboarding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-card/50 rounded-lg border border-border/50">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
            
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium mb-4">Cost Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Traditional Cost</span>
                  <span>${data.roi_metrics.traditional_onboarding_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CodeFlow Cost</span>
                  <span className="text-green-500">${data.roi_metrics.codeflow_onboarding_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 font-medium">
                  <span>Net Savings</span>
                  <span className="text-green-500">
                    ${(data.roi_metrics.traditional_onboarding_cost - data.roi_metrics.codeflow_onboarding_cost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Member Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.member_rankings.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    #{member.rank}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">{member.score}</div>
                  <Badge variant={member.status === 'on_track' ? 'default' : 'destructive'} className="text-[10px] h-5">
                    {member.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
