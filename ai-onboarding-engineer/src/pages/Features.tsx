/*
BILLION: A breakdown of the machine that builds engineers.
DIRECTION: Technical / Detailed / Grid-based
SIGNATURE: Features Breakdown
*/

import { motion } from "framer-motion"
import { Terminal, Cpu, Network, Share2, Code2, Users, FileCode, Zap } from "lucide-react"

const features = [
  {
    icon: Network,
    title: "Graph-Based Architecture Mapping",
    description: "We don't just read files. We build a semantic dependency graph of every function, class, and service in your repo."
  },
  {
    icon: Terminal,
    title: "Context-Aware Semantic Search",
    description: "Forget Grep. Ask \"How does auth work?\" and get an answer that connects the frontend component to the backend middleware."
  },
  {
    icon: Cpu,
    title: "Automated Micro-Tasks",
    description: "The AI generates safe, non-critical starter tasks (like \"add a log line here\" or \"update this type\") to get hands on keyboard immediately."
  },
  {
    icon: Share2,
    title: "Team Context Sharing",
    description: " senior engineers can annotate the graph. When they explain a system once, it's captured forever for every new hire."
  },
  {
    icon: Code2,
    title: "Multi-Repo Support",
    description: "Seamlessly link microservices. Understand how a change in the billing service affects the frontend dashboard."
  },
  {
    icon: Users,
    title: "Role-Based Onboarding Tracks",
    description: "Customized roadmaps for Backend, Frontend, DevOps, or QA engineers. Don't learn what you don't need."
  },
  {
    icon: FileCode,
    title: "Documentation Analysis",
    description: "We verify your Readme.md against the actual code. If the docs say valid, but the code says deprecated, we warn you."
  },
  {
    icon: Zap,
    title: "IDE Integration (Coming Soon)",
    description: "Get the Cortex Tutor directly in VS Code. Highlights complex logic and explains it in plain English."
  }
]

export default function Features() {
  return (
    <div className="min-h-screen bg-background py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center space-x-2 border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs font-mono text-primary tracking-wider uppercase">System Capabilities</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight">
            The Engine Under the Hood.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             Traditional onboarding is passive reading. Cortex is active engagement. Here is how we accelerate time-to-commit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-sm hover:border-primary/20 hover:bg-card/60 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
