import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowRight, CheckCircle2, Layers, Loader2, Network, FileCode, Box, Database, Server } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useLocation } from "react-router-dom"
import { getUserLatestRoadmap } from "@/lib/db"
import type { LucideIcon } from "lucide-react"

// Types matching the backend response
interface BackendCodeNode {
  id: string
  type: string
  name: string
  path: string
  metadata: {
    risk_score?: string
    [key: string]: unknown
  }
}

interface BackendGraphEdge {
  source: string
  target: string
  type: string
}

interface BackendCodeGraph {
  nodes: BackendCodeNode[]
  edges: BackendGraphEdge[]
}

interface Module {
  id: string
  label: string
  icon: LucideIcon
  x: number
  y: number
  details: string
  risk: string
  path: string
  type: string
}

interface Connection {
  from: string
  to: string
  type: string
}

export default function Architecture() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)

  useEffect(() => {
    const loadArchitecture = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        let codeGraph: BackendCodeGraph | null = null;

        // 1. Try to get data from navigation state
        if (location.state?.analysisData?.data?.code_graph) {
          codeGraph = location.state.analysisData.data.code_graph
        } 
        // 2. Fallback: Fetch latest analysis from DB
        else {
           const latestAnalysis = await getUserLatestRoadmap(user.uid)
           if (latestAnalysis?.data?.code_graph) {
              codeGraph = latestAnalysis.data.code_graph as BackendCodeGraph
           }
        }

        if (codeGraph) {
          processGraph(codeGraph)
        }
      } catch (error) {
        console.error("Error loading architecture:", error)
      } finally {
        setLoading(false)
      }
    }

    loadArchitecture()
  }, [user, location.state])

  const processGraph = (graph: BackendCodeGraph) => {
    // Simple Circular Layout
    const centerX = 400
    const centerY = 350
    const radius = 250
    const nodeCount = graph.nodes.length
    
    const processedModules: Module[] = graph.nodes.map((node, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI
      
      // Determine Icon
      let Icon = FileCode
      if (node.name.includes("api") || node.name.includes("server")) Icon = Server
      if (node.name.includes("db") || node.name.includes("store")) Icon = Database
      if (node.type === "class") Icon = Box

      return {
        id: node.id,
        label: node.name,
        icon: Icon,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        details: `Path: ${node.path}`, // In a real app, this would be the AI summary
        risk: node.metadata.risk_score || "unknown",
        path: node.path,
        type: node.type
      }
    })

    const processedConnections: Connection[] = graph.edges.map(edge => ({
      from: edge.source,
      to: edge.target,
      type: edge.type
    }))

    setModules(processedModules)
    setConnections(processedConnections)
    if (processedModules.length > 0) {
      setSelectedModule(processedModules[0])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <Network className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Architecture Data</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Analyze a repository first to visualize its architecture and understand module relationships.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-4rem)]">
      {/* Interactive Graph Section */}
      <div className="flex-1 rounded-3xl border border-white/10 bg-card/30 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[16px_16px]" />
        
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-auto">
            <svg className="absolute inset-0 pointer-events-none w-full h-full min-w-[800px] min-h-[800px]">
              {connections.map((conn, idx) => {
                const from = modules.find(m => m.id === conn.from)
                const to = modules.find(m => m.id === conn.to)
                
                if (!from || !to) return null

                return (
                  <motion.line 
                    key={idx}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-white/20"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                )
              })}
            </svg>

            <div className="relative w-[800px] h-[700px]">
              {modules.map((mod) => (
                <motion.button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`absolute p-4 rounded-xl border backdrop-blur-md transition-all duration-300 w-40 flex flex-col items-center gap-2 group/node z-10
                    ${selectedModule?.id === mod.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_30px_-5px_hsl(var(--primary))]" 
                      : "bg-card border-border hover:border-primary/50"
                    }
                  `}
                  style={{ left: mod.x - 80, top: mod.y - 40 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <mod.icon className="w-8 h-8" />
                  <span className="font-semibold text-sm truncate w-full text-center" title={mod.label}>{mod.label}</span>
                  
                  {mod.risk === "safe" && <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full box-content border-2 border-background" />}
                  {mod.risk === "critical" && <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full box-content border-2 border-background" />}
                </motion.button>
              ))}
            </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded backdrop-blur border border-white/5">
          Visualized from Codebase Analysis
        </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence mode="wait">
        {selectedModule && (
          <motion.div 
            key={selectedModule.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full lg:w-96"
          >
            <Card className="h-full border-t border-x-0 lg:border-l lg:border-y border-b lg:border-r-0 lg:rounded-l-none lg:rounded-r-xl bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                   <div className="p-3 bg-primary/10 rounded-lg">
                      <selectedModule.icon className="w-6 h-6 text-primary" />
                   </div>
                   <Badge variant={
                      selectedModule.risk === 'critical' ? 'destructive' : 
                      selectedModule.risk === 'moderate' || selectedModule.risk === 'high' ? 'destructive' : 
                      'outline'
                   } className={selectedModule.risk === 'safe' || selectedModule.risk === 'low' ? 'text-green-500 border-green-500/50' : ''}>
                      {selectedModule.risk === 'safe' || selectedModule.risk === 'low' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {selectedModule.risk.toUpperCase()}
                   </Badge>
                </div>
                <CardTitle className="mt-4 text-2xl truncate" title={selectedModule.label}>{selectedModule.label}</CardTitle>
                <CardDescription className="line-clamp-2" title={selectedModule.id}>{selectedModule.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-1 text-muted-foreground">About</h4>
                  <p className="text-sm leading-relaxed font-mono bg-muted/50 p-2 rounded break-all">
                    {selectedModule.path}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Outgoing Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                     {connections.filter(c => c.from === selectedModule.id).map((c, i) => (
                       <Badge key={i} variant="outline" className="pl-1">
                          <ArrowRight className="w-3 h-3 mr-1 opacity-50" />
                          {modules.find(m => m.id === c.to)?.label || c.to}
                       </Badge>
                     ))}
                     {connections.filter(c => c.from === selectedModule.id).length === 0 && (
                       <span className="text-xs text-muted-foreground italic">No outgoing dependencies</span>
                     )}
                  </div>
                </div>

                <div>
                   <h4 className="text-sm font-medium mb-2 text-muted-foreground">Incoming References</h4>
                   <div className="flex flex-wrap gap-2">
                     {connections.filter(c => c.to === selectedModule.id).map((c, i) => (
                       <Badge key={i} variant="secondary" className="pl-1">
                          <Layers className="w-3 h-3 mr-1 opacity-50" />
                          {modules.find(m => m.id === c.from)?.label || c.from}
                       </Badge>
                     ))}
                     {connections.filter(c => c.to === selectedModule.id).length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No incoming references</span>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

