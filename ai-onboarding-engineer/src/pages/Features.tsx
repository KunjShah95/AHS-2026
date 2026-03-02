import { motion } from "framer-motion"
import { Terminal, Cpu, Network, Share2, Users, ArrowRight, Orbit, ShieldCheck, Zap } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: Network,
    title: "Institutional Synthesis",
    description: "Multi-layered dependency mapping with deep intent resolution. We don't just see files; we see the institutional architectural DNA.",
    metrics: ["AST mastery", "Intent Resolution"],
    color: "text-cyan-400"
  },
  {
    icon: Terminal,
    title: "Neural Query Interface",
    description: "Autonomous response engine trained on your core artifacts. Ask complex architectural questions and trace logic clusters in real-time.",
    metrics: ["Linguistic Precision", "Cross-Grid Linking"],
    color: "text-primary"
  },
  {
    icon: Cpu,
    title: "Autonomous Task Casting",
    description: "Generation of non-critical entry points, precisely calibrated to cohort proficiency. High-bandwidth contribution, zero systemic risk.",
    metrics: ["Instant Velocity", "Risk Pruning"],
    color: "text-teal-400"
  },
  {
    icon: Share2,
    title: "Tribal Memory Capture",
    description: "Senior intuition persistency across version shifts. Static documentation is replaced with an active, living memory layer.",
    metrics: ["Zero Decay", "Mentorship Scale"],
    color: "text-emerald-400"
  },
  {
    icon: Orbit,
    title: "Cluster-Wide Intelligence",
    description: "Universal understanding across microservice boundaries. Detect upstream ripple effects and downstream dependency failures.",
    metrics: ["Macro-Analysis", "Systemic Mapping"],
    color: "text-cyan-400"
  },
  {
    icon: Users,
    title: "Persona-Driven Curricula",
    description: "Role-Specific roadmap generation. Backend, Platform, and Frontend pathways are synthesized with distinct context parameters.",
    metrics: ["Cohort Precision", "Dynamic Pacing"],
    color: "text-primary"
  },
  {
    icon: ShieldCheck,
    title: "Audit-Grade Validation",
    description: "Automated integrity checks for internal knowledge bases. Prunes outdated information before it creates cognitive friction.",
    metrics: ["Auto-Sync", "Truth Integrity"],
    color: "text-teal-400"
  },
  {
    icon: Terminal,
    title: "Integrated Environment Hub",
    description: "Native IDE overlays that inject context directly into the code path. Institutional wisdom at the cursor level.",
    metrics: ["Zero Context Switch", "Live Flow"],
    color: "text-emerald-400"
  }
]

const benefits = [
  {
    stat: "85%",
    label: "Velocity compression",
    description: "From 6 months to 3 weeks average cycle time."
  },
  {
    stat: "$180K",
    label: "Capital yield per node",
    description: "Elimination of unproductive context switching."
  },
  {
    stat: "12K+",
    label: "Audited Intelligence Nodes",
    description: "Across industrial-grade tech stacks."
  }
]

export default function Features() {
  return (
    <div className="min-h-screen bg-background text-foreground py-24 px-6 md:px-8 overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-160 h-160 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-24 md:space-y-32 pb-32">
        {/* Hero Section */}
        <motion.div 
          className="text-center space-y-10 md:space-y-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="accent" className="mx-auto">
            <Zap className="h-3 w-3" />
            Structural Capabilities
          </Badge>
          
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
              <span className="text-foreground">The Architecture</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                of Mastery
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
              Legacy onboarding is based on documentation debt. CodeFlow is powered by active intelligence. Reclaim your institutional velocity.
            </p>
          </div>
        </motion.div>

        {/* Benefits Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card variant="glow" className="h-full p-8 md:p-10 group hover:scale-105 transition-transform">
                <CardContent className="space-y-4 text-center">
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent tabular-nums">
                    {benefit.stat}
                  </div>
                  <div className="text-xs font-semibold text-primary uppercase tracking-widest">
                    {benefit.label}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.5 }}
            >
              <Card className="h-full group hover:shadow-card-elevated transition-shadow overflow-hidden">
                <CardContent className="p-6 md:p-8 h-full flex flex-col relative">
                  {/* Icon */}
                  <motion.div 
                    className="h-12 w-12 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-3 uppercase tracking-tight">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground font-medium mb-6 flex-1 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Metrics Badges */}
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-border/30">
                    {feature.metrics.map((metric, mIdx) => (
                      <Badge 
                        key={mIdx} 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div 
          className="p-12 md:p-16 lg:p-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 text-center space-y-10 relative overflow-hidden shadow-xl group"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Animated background */}
          <div className="absolute top-0 right-0 w-160 h-160 bg-primary/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight uppercase">
              <span className="text-foreground">Stop Documenting.</span>
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Reclaim Flow.
              </span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
              <Link to="/analysis">
                <Button 
                  size="xl"
                  className="h-14 px-10 font-bold uppercase tracking-wide shadow-lg hover:shadow-xl group/btn"
                >
                  Analyze Cluster
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between text-xs font-semibold uppercase tracking-widest px-6 md:px-8 py-4 bg-background/80 backdrop-blur-md border-t border-border/30 z-20">
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-muted-foreground">Intelligence Cluster Active</span>
        </div>
        
        <div className="hidden md:block text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>
      </footer>
    </div>
  )
}
