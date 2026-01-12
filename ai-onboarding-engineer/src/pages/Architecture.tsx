import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowRight, 
  Layers, 
  Loader2, 
  Network, 
  FileCode, 
  Box, 
  Database, 
  Server,
  Search,
  Zap,
  Cpu,
  Binary,
  Fingerprint,
  Code2,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useLocation } from "react-router-dom"
import { getUserLatestRoadmap } from "@/lib/db"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const processGraph = useCallback((graph: BackendCodeGraph) => {
    const centerX = 500
    const centerY = 450
    const radius = 350
    const nodeCount = graph.nodes.length
    
    const processedModules: Module[] = graph.nodes.map((node, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI
      let Icon = FileCode
      if (node.name.toLowerCase().includes("api") || node.name.toLowerCase().includes("server")) Icon = Server
      if (node.name.toLowerCase().includes("db") || node.name.toLowerCase().includes("store") || node.name.toLowerCase().includes("schema")) Icon = Database
      if (node.type === "class") Icon = Box
      if (node.type === "module") Icon = Cpu

      return {
        id: node.id,
        label: node.name,
        icon: Icon,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        details: `Path: ${node.path}`,
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
  }, [])

  useEffect(() => {
    const loadArchitecture = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        let codeGraph: BackendCodeGraph | null = null;
        if (location.state?.analysisData?.data?.code_graph) {
          codeGraph = location.state.analysisData.data.code_graph
        } else {
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
  }, [user, location.state, processGraph])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Resolving Dependency Graph...</span>
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 space-y-8">
        <div className="h-24 w-24 rounded-4xl bg-gray-900 flex items-center justify-center border-2 border-dashed border-gray-800">
           <Network className="h-10 w-10 text-gray-700" />
        </div>
        <div className="text-center space-y-4">
           <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
             Zero <span className="text-gray-600 not-italic">Data</span>
           </h3>
           <p className="text-gray-500 font-medium italic text-lg max-w-md">
             Initialize repository analysis to synthesize architectural blueprints and entity hierarchies.
           </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 h-[calc(100vh-10rem)] flex flex-col xl:flex-row gap-12">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12">
             <div className="space-y-4">
                <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                   /archive/structural-blueprints
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                  Architectural <span className="not-italic text-gray-500">Engine</span>
                </h1>
                <p className="text-lg text-gray-500 font-medium italic">
                  Synthetic visualization of systemic topology and dependency recursion.
                </p>
             </div>
             
             <div className="flex items-center gap-6 bg-gray-900/40 p-4 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="text-right">
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Active Entities</div>
                   <div className="text-xl font-black text-white italic tracking-tighter tabular-nums">{modules.length} Nodes</div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                   <Network className="h-5 w-5 text-indigo-400" />
                </div>
             </div>
          </header>

          <div className="flex-1 relative bg-gray-900/40 border border-gray-800 rounded-5xl overflow-hidden group shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-size-[32px_32px]" />
            
            <div className="relative w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-20 cursor-grab active:cursor-grabbing">
               <svg className="absolute inset-0 pointer-events-none w-250 h-225 mx-auto opacity-40">
                 <defs>
                   <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto">
                     <polygon points="0 0, 12 4, 0 8" fill="currentColor" fillOpacity="0.4" />
                   </marker>
                 </defs>
                 {connections.map((conn, idx) => {
                   const from = modules.find(m => m.id === conn.from)
                   const to = modules.find(m => m.id === conn.to)
                   if (!from || !to) return null

                   const isRelated = hoveredNode === from.id || hoveredNode === to.id || 
                                    selectedModule?.id === from.id || selectedModule?.id === to.id

                   return (
                     <motion.line 
                       key={idx}
                       x1={from.x} y1={from.y}
                       x2={to.x} y2={to.y}
                       stroke="currentColor"
                       strokeWidth={isRelated ? "2.5" : "1.2"}
                       markerEnd="url(#arrowhead)"
                       className={`transition-all duration-700 ${isRelated ? 'text-indigo-400 opacity-100' : 'text-gray-800 opacity-20'}`}
                       initial={{ pathLength: 0 }}
                       animate={{ pathLength: 1 }}
                       transition={{ duration: 2, ease: "circOut" }}
                     />
                   )
                 })}
               </svg>

               <div className="relative w-250 h-225">
                 {modules.map((mod) => (
                   <motion.button
                     key={mod.id}
                     onClick={() => setSelectedModule(mod)}
                     onMouseEnter={() => setHoveredNode(mod.id)}
                     onMouseLeave={() => setHoveredNode(null)}
                     className={`absolute p-6 rounded-4xl border transition-all duration-700 w-48 flex flex-col items-center gap-4 group/node z-10
                       ${selectedModule?.id === mod.id 
                         ? "bg-white border-white text-black scale-110 shadow-[0_20px_50px_-10px_rgba(255,255,255,0.2)]" 
                         : "bg-black/80 border-gray-800 text-gray-500 hover:border-indigo-500/50 hover:bg-gray-900/90"
                       }
                     `}
                     style={{ left: mod.x - 96, top: mod.y - 55 }}
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                   >
                     <div className={`p-4 rounded-2xl transition-all duration-500 shadow-inner ${selectedModule?.id === mod.id ? 'bg-black/10' : 'bg-gray-900 group-hover/node:bg-indigo-500/10 group-hover/node:scale-110'}`}>
                        <mod.icon className={`w-7 h-7 transition-colors ${selectedModule?.id === mod.id ? 'text-black' : 'text-gray-500 group-hover/node:text-indigo-400'}`} />
                     </div>
                     <span className={`font-black text-[10px] truncate w-full text-center uppercase tracking-widest transition-colors italic ${selectedModule?.id === mod.id ? 'text-black' : 'text-gray-500 group-hover/node:text-gray-300'}`}>
                        {mod.label}
                     </span>
                     
                     {mod.risk === "critical" && (
                       <span className="absolute -top-2 -right-2 flex h-5 w-5">
                         <span className="animate-ping absolute flex h-full w-full rounded-full bg-rose-500 opacity-40"></span>
                         <span className="relative rounded-full h-5 w-5 bg-rose-500 border-[3px] border-black flex items-center justify-center">
                            <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                         </span>
                       </span>
                     )}
                   </motion.button>
                 ))}
               </div>
            </div>

            <div className="absolute bottom-10 left-10 flex items-center gap-6">
               <div className="flex items-center gap-3 px-5 py-2.5 bg-black/80 rounded-2xl border border-gray-800 text-[10px] font-black text-gray-600 uppercase tracking-widest shadow-2xl backdrop-blur-xl italic">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  Active Entity
               </div>
               <div className="flex items-center gap-3 px-5 py-2.5 bg-black/80 rounded-2xl border border-gray-800 text-[10px] font-black text-gray-600 uppercase tracking-widest shadow-2xl backdrop-blur-xl italic">
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                  Critical Hub
               </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedModule && (
            <motion.div 
              key={selectedModule.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full xl:w-112.5 shrink-0"
            >
              <Card className="h-full bg-gray-900/60 border border-gray-800 rounded-5xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative transition-all duration-700">
                <div className="h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-rose-500" />
                <CardContent className="p-12 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
                  <header>
                     <div className="flex items-start justify-between mb-8">
                        <div className="space-y-3">
                           <div className="text-[10px] uppercase font-black text-indigo-400 tracking-[0.3em] italic mb-3">Target Node Registry</div>
                           <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none break-all">{selectedModule.label}</h2>
                        </div>
                        <div className={`p-6 rounded-4xl bg-black border border-gray-800 shadow-inner group-hover:scale-110 transition-transform ${selectedModule.risk === 'critical' ? 'border-rose-500/30' : 'border-indigo-500/30'}`}>
                           <selectedModule.icon className={`w-10 h-10 ${selectedModule.risk === 'critical' ? 'text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]'}`} />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                           <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest italic">Risk Factor</div>
                           <div className={`text-2xl font-black italic tracking-tighter uppercase ${selectedModule.risk === 'critical' ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedModule.risk}</div>
                        </div>
                        <div className="p-6 rounded-3xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                           <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest italic">Entity Type</div>
                           <div className="text-2xl font-black text-white italic tracking-tighter uppercase tabular-nums">{selectedModule.type}</div>
                        </div>
                     </div>
                  </header>

                  <div className="space-y-4">
                     <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-1 italic">Genetic Path</div>
                     <div className="p-6 rounded-2xl bg-black border border-gray-800 group/code relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/40" />
                        <p className="text-[10px] font-mono text-gray-500 leading-relaxed whitespace-pre-wrap italic group-hover/code:text-gray-300 transition-colors">
                           {selectedModule.path}
                        </p>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-1 italic flex items-center justify-between">
                       <span>Egress Relations</span>
                       <Zap className="h-3 w-3 text-indigo-400" />
                    </h3>
                    <div className="space-y-3">
                       {connections.filter(c => c.from === selectedModule.id).map((c, i) => (
                         <div key={i} className="group/row flex items-center justify-between p-5 rounded-2xl bg-black border border-gray-900 hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                               <div className="h-8 w-8 rounded-lg bg-indigo-500/05 border border-indigo-500/10 flex items-center justify-center">
                                  <Code2 className="h-4 w-4 text-indigo-600 group-hover/row:text-indigo-400 transition-colors" />
                               </div>
                               <span className="text-xs font-black text-gray-500 group-hover/row:text-white transition-colors uppercase italic tracking-tight">{modules.find(m => m.id === c.to)?.label || c.to}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-800 group-hover/row:text-indigo-400 transition-transform group-hover/row:translate-x-1" />
                         </div>
                       ))}
                       {connections.filter(c => c.from === selectedModule.id).length === 0 && (
                         <div className="text-[10px] text-gray-700 font-black uppercase tracking-widest p-10 border border-dashed border-gray-800 rounded-4xl text-center italic">Institutional Terminal Node</div>
                       )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-1 italic flex items-center justify-between">
                       <span>Ingress Origins</span>
                       <Layers className="h-3 w-3 text-indigo-400" />
                    </h3>
                    <div className="space-y-3">
                       {connections.filter(c => c.to === selectedModule.id).map((c, i) => (
                         <div key={i} className="group/row flex items-center justify-between p-5 rounded-2xl bg-black border border-gray-900 hover:border-indigo-500/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                               <div className="h-8 w-8 rounded-lg bg-purple-500/05 border border-purple-500/10 flex items-center justify-center">
                                  <Binary className="h-4 w-4 text-purple-600 group-hover/row:text-purple-400 transition-colors" />
                               </div>
                               <span className="text-xs font-black text-gray-500 group-hover/row:text-white transition-colors uppercase italic tracking-tight">{modules.find(m => m.id === c.from)?.label || c.from}</span>
                            </div>
                            <div className="text-[9px] font-black text-gray-800 uppercase tracking-[0.2em] italic pr-2">Origin</div>
                         </div>
                       ))}
                       {connections.filter(c => c.to === selectedModule.id).length === 0 && (
                          <div className="text-[10px] text-gray-700 font-black uppercase tracking-widest p-10 border border-dashed border-gray-800 rounded-4xl text-center italic">Genetic Root entry point</div>
                       )}
                    </div>
                  </div>

                  <div className="pt-12 border-t border-gray-800/50 pb-8">
                     <Button className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                        <Search className="h-4 w-4" />
                        Inspect Implementation
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            System Topology Active
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <Fingerprint className="h-3 w-3 text-gray-800" />
               Institutional Blueprint v1.0.4
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
