import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookTemplate, 
  Clock, 
  Users, 
  Star, 
  ArrowRight,
  GitBranch,
  Copy
} from "lucide-react"

interface PlaybookPhase {
  phase_number: number
  title: string
  duration_hours: number
  objectives: string[]
}

interface OnboardingPlaybook {
  id: string
  name: string
  description: string
  target_role: string
  total_hours: number
  phases: PlaybookPhase[]
  success_rate: number
  times_used: number
  tags: string[]
  is_template: boolean
}

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<OnboardingPlaybook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlaybooks = async () => {
      try {
        const response = await api.get<OnboardingPlaybook[]>("/playbooks/list")
        setPlaybooks(response)
      } catch (error) {
        console.error("Failed to fetch playbooks:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlaybooks()
  }, [])

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Onboarding Playbooks</h1>
        <p className="text-muted-foreground">
          Standardized, proven onboarding paths for every role in your engineering team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {playbooks.map((playbook) => (
          <motion.div 
             key={playbook.id}
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.3 }}
          >
            <Card className="h-full flex flex-col hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{playbook.name}</CardTitle>
                    <Badge variant="secondary" className="font-normal">
                      {playbook.target_role}
                    </Badge>
                  </div>
                  {playbook.is_template && (
                     <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200">
                       Template
                     </Badge>
                  )}
                </div>
                <CardDescription className="pt-2">
                  {playbook.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{playbook.total_hours} Hours</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{playbook.times_used} Used</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-orange-400" />
                    <span>{playbook.success_rate.toFixed(0)}% Success</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Included Phases:</p>
                  <div className="space-y-2">
                    {playbook.phases.slice(0, 3).map((phase) => (
                      <div key={phase.phase_number} className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {phase.phase_number}
                        </div>
                        <span className="truncate">{phase.title}</span>
                      </div>
                    ))}
                    {playbook.phases.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-9">
                        + {playbook.phases.length - 3} more phases
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                   {playbook.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="opacity-70 text-xs font-normal">
                        #{tag}
                      </Badge>
                   ))}
                </div>
              </CardContent>

              <CardFooter className="border-t bg-muted/10">
                <div className="flex w-full gap-3">
                   <Button className="flex-1 gap-2">
                     <BookTemplate className="h-4 w-4" /> Use Playbook
                   </Button>
                   <Button variant="outline" size="icon" title="Clone as Template">
                     <Copy className="h-4 w-4" />
                   </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {playbooks.length === 0 && !loading && (
        <div className="text-center py-12">
           <p className="text-muted-foreground">No playbooks found. Create your first one!</p>
           <Button className="mt-4">Create Playbook</Button>
        </div>
      )}
    </div>
  )
}
