import { motion } from "framer-motion"
import { Terminal, Cpu, Network, Share2, Users, ArrowRight, Binary, Orbit, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Network,
    title: "Institutional Synthesis",
    description: "Multi-layered dependency mapping with deep intent resolution. We don't just see files; we see the institutional architectural DNA.",
    metrics: ["AST mastery", "Intent Resolution"],
    color: "text-indigo-400"
  },
  {
    icon: Terminal,
    title: "Neural Query Interface",
    description: "Autonomous response engine trained on your core artifacts. Ask complex architectural questions and trace logic clusters in real-time.",
    metrics: ["Linguistic Precision", "Cross-Grid Linking"],
    color: "text-purple-400"
  },
  {
    icon: Cpu,
    title: "Autonomous Task Casting",
    description: "Generation of non-critical entry points, precisely calibrated to cohort proficiency. High-bandwidth contribution, zero systemic risk.",
    metrics: ["Instant Velocity", "Risk Pruning"],
    color: "text-emerald-400"
  },
  {
    icon: Share2,
    title: "Tribal Memory Capture",
    description: "Senior intuition persistency across version shifts. Static documentation is replaced with an active, living memory layer.",
    metrics: ["Zero Decay", "Mentorship Scale"],
    color: "text-rose-400"
  },
  {
    icon: Orbit,
    title: "Cluster-Wide Intelligence",
    description: "Universal understanding across microservice boundaries. Detect upstream ripple effects and downstream dependency failures.",
    metrics: ["Macro-Analysis", "Systemic Mapping"],
    color: "text-indigo-400"
  },
  {
    icon: Users,
    title: "Persona-Driven Curricula",
    description: "Role-Specific roadmap generation. Backend, Platform, and Frontend pathways are synthesized with distinct context parameters.",
    metrics: ["Cohort Precision", "Dynamic Pacing"],
    color: "text-purple-400"
  },
  {
    icon: ShieldCheck,
    title: "Audit-Grade Validation",
    description: "Automated integrity checks for internal knowledge bases. Prunes outdated information before it creates cognitive friction.",
    metrics: ["Auto-Sync", "Truth Integrity"],
    color: "text-emerald-400"
  },
  {
    icon: Binary,
    title: "Integrated Environment Hub",
    description: "Native IDE overlays that inject context directly into the code path. Institutional wisdom at the cursor level.",
    metrics: ["Zero Context Switch", "Live Flow"],
    color: "text-rose-400"
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
    <div className="min-h-screen bg-black text-white py-24 px-6 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-32 pb-32">
        <div className="text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6"
          >
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.3em] italic">Structural Capabilities</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight mb-10 italic">
            <span className="bg-linear-to-r from-white via-white to-gray-500 bg-clip-text text-transparent italic">
              The Architecture
            </span>
            <br />
            <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-rose-400 bg-clip-text text-transparent not-italic">
              of Mastery
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed italic">
            Legacy onboarding is based on documentation debt. CodeFlow is powered by active intelligence. Reclaim your institutional velocity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-10 bg-gray-900/40 border border-gray-800 rounded-4xl text-center hover:border-gray-700 transition-all shadow-2xl"
            >
              <div className="text-6xl font-black mb-4 bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tabular-nums italic">
                {benefit.stat}
              </div>
              <div className="text-xs font-black text-white uppercase tracking-[0.3em] mb-4 italic">
                {benefit.label}
              </div>
              <div className="text-[10px] text-gray-600 font-medium italic uppercase tracking-widest">
                {benefit.description}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group relative p-8 bg-black border border-gray-900 rounded-4xl hover:border-indigo-500/40 transition-all overflow-hidden"
            >
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-black mb-4 text-white uppercase tracking-tight italic">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm mb-10 leading-relaxed font-semibold italic">
                  {feature.description}
                </p>
                <div className="flex gap-2 flex-wrap pt-6 border-t border-gray-900">
                  {feature.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 uppercase tracking-widest border border-indigo-500/10 italic">
                      {metric}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        <div className="p-16 rounded-5xl bg-linear-to-br from-indigo-600 to-indigo-900 text-center space-y-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.5)] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-160 h-160 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase max-w-3xl mx-auto leading-none text-white italic relative z-10">
              Stop Documenting. <br className="hidden md:block" /> Reclaim Institutional Flow.
           </h2>
           <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6 relative z-10">
              <Link to="/analysis">
                <Button className="h-20 px-12 bg-white text-black font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-4 group italic">
                   Analyze Cluster
                   <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Intelligence Cluster Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Discovery v3.0.2
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
