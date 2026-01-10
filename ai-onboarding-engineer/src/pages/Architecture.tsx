import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowRight, CheckCircle2, Database, Globe, Layers, Lock, Server } from "lucide-react"

// Mock Architecture Data
const modules = [
  { 
    id: "frontend", 
    label: "Frontend (React)", 
    icon: Globe, 
    x: 400, y: 100, 
    details: "Handles user interaction and UI rendering. Uses React + Vite.",
    risk: "safe"
  },
  { 
    id: "api", 
    label: "API Gateway", 
    icon: Server, 
    x: 400, y: 250, 
    details: "Routes requests, handles authentication, and rate limiting.",
    risk: "moderate"
  },
  { 
    id: "auth", 
    label: "Auth Service", 
    icon: Lock, 
    x: 200, y: 400, 
    details: "Manages users, sessions, and JWTs. Critical security module.",
    risk: "critical"
  },
  { 
    id: "core", 
    label: "Core Logic", 
    icon: Layers, 
    x: 600, y: 400, 
    details: "Business rules and data processing engines.",
    risk: "safe"
  },
  { 
    id: "db", 
    label: "Database", 
    icon: Database, 
    x: 400, y: 550, 
    details: "PostgreSQL storage for all persistent data.",
    risk: "critical"
  },
]

const connections = [
  { from: "frontend", to: "api" },
  { from: "api", to: "auth" },
  { from: "api", to: "core" },
  { from: "auth", to: "db" },
  { from: "core", to: "db" },
]

export default function Architecture() {
  const [selectedModule, setSelectedModule] = useState(modules[0])

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-4rem)]">
      {/* Interactive Graph Section */}
      <div className="flex-1 rounded-3xl border border-white/10 bg-card/30 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[16px_16px]" />
        
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center">
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              {connections.map((conn, idx) => {
                const from = modules.find(m => m.id === conn.from)!
                const to = modules.find(m => m.id === conn.to)!
                // Simple straight lines for now, or bezier
                // Adjust coords based on container (this is tricky without real measurements, using mocked relative positions)
                // To make it responsive, we use percentages or a fixed viewBox. 
                // Let's use a fixed viewBox 800x800 for simplicity in this demo.
                return (
                  <motion.line 
                    key={idx}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border"
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
                  className={`absolute p-4 rounded-xl border backdrop-blur-md transition-all duration-300 w-40 flex flex-col items-center gap-2 group/node
                    ${selectedModule.id === mod.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_30px_-5px_hsl(var(--primary))]" 
                      : "bg-card border-border hover:border-primary/50"
                    }
                  `}
                  style={{ left: mod.x - 80, top: mod.y - 40 }} // center alignment
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <mod.icon className="w-8 h-8" />
                  <span className="font-semibold text-sm">{mod.label}</span>
                  
                  {mod.risk === "safe" && <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full box-content border-2 border-background" />}
                  {mod.risk === "critical" && <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full box-content border-2 border-background" />}
                </motion.button>
              ))}
            </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded backdrop-blur border border-white/5">
          Graphical View • 80% Zoom
        </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence mode="wait">
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
                    selectedModule.risk === 'moderate' ? 'default' : 
                    'secondary' // Using secondary for 'safe' usually means green/neutral in our theme
                 }>
                    {selectedModule.risk === 'safe' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {selectedModule.risk.toUpperCase()}
                 </Badge>
              </div>
              <CardTitle className="mt-4 text-2xl">{selectedModule.label}</CardTitle>
              <CardDescription>Module ID: {selectedModule.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-1 text-muted-foreground">Responsibility</h4>
                <p className="text-sm leading-relaxed">{selectedModule.details}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Dependencies</h4>
                <div className="flex flex-wrap gap-2">
                   {connections.filter(c => c.from === selectedModule.id).map(c => (
                     <Badge key={c.to} variant="outline" className="pl-1">
                        <ArrowRight className="w-3 h-3 mr-1 opacity-50" />
                        {modules.find(m => m.id === c.to)?.label}
                     </Badge>
                   ))}
                   {connections.filter(c => c.from === selectedModule.id).length === 0 && (
                     <span className="text-xs text-muted-foreground italic">None</span>
                   )}
                </div>
              </div>

               <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Key Files</h4>
                <div className="space-y-1">
                   {/* Mock files */}
                   <div className="flex items-center gap-2 text-xs font-mono bg-secondary/50 p-2 rounded border border-white/5 cursor-pointer hover:bg-secondary transition-colors">
                      <Layers className="w-3 h-3" />
                      src/{selectedModule.id}/index.ts
                   </div>
                   <div className="flex items-center gap-2 text-xs font-mono bg-secondary/50 p-2 rounded border border-white/5 cursor-pointer hover:bg-secondary transition-colors">
                      <Layers className="w-3 h-3" />
                      src/{selectedModule.id}/types.ts
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
