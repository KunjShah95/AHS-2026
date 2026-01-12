import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, Zap, Shield, Code2, Target, 
  Sparkles, Network,
  ChevronRight, BrainCircuit, Globe, Cpu, Layers,
  Compass, Workflow, Gauge, Binary
} from "lucide-react"

export default function Landing() {
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  const stats = [
    { value: "6 mo → 3 wk", label: "Onboarding Scale", icon: Target, color: "text-indigo-400" },
    { value: "153K+", label: "Productivity Yield", icon: Sparkles, color: "text-purple-400" },
    { value: "12K+", label: "Neural Audits", icon: Code2, color: "text-emerald-400" },
    { value: "99.99%", label: "Grid Stability", icon: Shield, color: "text-rose-400" }
  ]

  const features = [
    {
      title: "Neural Repository Synthesis",
      description: "Industrial-grade AST parsing with multi-layer dependency mapping. Our engines resolve architectural intent where traditional tools see only files.",
      icon: Cpu,
      metrics: ["SOC-II Certified", "AST Mastery"],
      color: "from-indigo-600/20"
    },
    {
      title: "Living Context Pathways",
      description: "Dynamic roadmaps that evolve with every commit. We transform unstructured institutional memory into high-bandwidth learning vectors.",
      icon: Compass,
      metrics: ["Zero maintenance", "Adaptive UI"],
      color: "from-purple-600/20"
    },
    {
      title: "Architectural Tracer",
      description: "Visualize the institutional DNA of your code. Identify critical risk zones and fragile dependency cycles before they stall your sprint.",
      icon: Network,
      metrics: ["Real-time graph", "Risk Index"],
      color: "from-emerald-600/20"
    },
    {
      title: "Capability Analytics",
      description: "Enterprise-grade performance dashboards. Quantify cohort progression and reclaim senior capacity through autonomous intelligence.",
      icon: Gauge,
      metrics: ["Predictive ROI", "Cohort Audit"],
      color: "from-rose-600/20"
    }
  ]

  const steps = [
    { id: "01", title: "Map Artifacts", desc: "Initialize a high-fidelity scan of your core repository clusters.", icon: Layers },
    { id: "02", title: "Resolve Context", desc: "Our neural engine synthesizes institutional knowledge and logic flows.", icon: BrainCircuit },
    { id: "03", title: "Compress Time", desc: "Deployment of custom pathways to new hires, reclaiming institutional velocity.", icon: Zap }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />
      <div className="fixed inset-0 opacity-10 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[60px_60px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 md:px-8 pt-32 pb-20">
        <div className="max-w-7xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center relative z-20"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-12 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em] italic">Institutional Intelligence v3.0.4</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-10 leading-[0.85] tracking-tighter">
              <span className="bg-linear-to-r from-white via-white to-gray-500 bg-clip-text text-transparent uppercase">
                Context is <br className="hidden lg:block"/> The Bottleneck.
              </span>
              <br />
              <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-rose-400 bg-clip-text text-transparent italic lowercase tracking-normal">
                codeflow resolves it.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium italic">
              We compress 6 months of traditional engineering ramp-up into 3 clinical weeks. Autonomous architecture mapping. Personalized context pathways. Real-time mastery.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-24">
              <Link to="/analysis">
                <Button className="h-20 px-12 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-3xl hover:bg-gray-200 transition-all shadow-[0_40px_100px_-15px_rgba(255,255,255,0.2)] group flex items-center gap-4 italic">
                  Initialize Scan
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/register">
                <Button className="h-20 px-12 bg-transparent border border-gray-800 text-white font-black uppercase tracking-widest text-[10px] rounded-3xl hover:bg-white/5 transition-all italic">
                  Enterprise Access
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-12 justify-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 italic">
              <div className="flex items-center gap-3 group cursor-default">
                <Globe className="h-4 w-4 text-indigo-400 group-hover:scale-125 transition-transform" />
                <span className="group-hover:text-gray-300 transition-colors">Distributed Sync</span>
              </div>
              <div className="flex items-center gap-3 group cursor-default">
                <Shield className="h-4 w-4 text-purple-400 group-hover:scale-125 transition-transform" />
                <span className="group-hover:text-gray-300 transition-colors">Industrial Security</span>
              </div>
              <div className="flex items-center gap-3 group cursor-default">
                <Workflow className="h-4 w-4 text-rose-400 group-hover:scale-125 transition-transform" />
                <span className="group-hover:text-gray-300 transition-colors">Native Toolchain</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-y border-gray-900 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className="text-4xl md:text-5xl font-black mb-2 text-white tabular-nums tracking-tighter italic">
                  {stat.value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center justify-center gap-2 italic">
                   <stat.icon className={`h-3 w-3 ${stat.color}`} />
                   {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32 space-y-6">
            <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] italic">Core Fabric</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
              Built for <br className="hidden md:block"/> Industrial Scale
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative p-12 bg-linear-to-br ${feature.color} to-transparent border border-gray-800 rounded-4xl hover:border-indigo-500/40 transition-all overflow-hidden shadow-2xl`}
              >
                <div className="relative z-10">
                   <div className="h-16 w-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-8 w-8 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                   </div>
                   <h3 className="text-3xl font-black mb-6 text-white uppercase tracking-tighter leading-none group-hover:text-indigo-400 transition-colors italic">
                     {feature.title}
                   </h3>
                   <p className="text-gray-400 text-lg mb-10 leading-relaxed font-medium italic">
                     {feature.description}
                   </p>
                   <div className="flex gap-4 pt-8 border-t border-gray-800/50">
                     {feature.metrics.map((metric, mIdx) => (
                       <div key={mIdx} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-3 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-full italic">
                         {metric}
                       </div>
                     ))}
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-40 bg-zinc-950/50 border-y border-gray-900 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
               <div className="space-y-12">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">The Protocol</div>
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">Context <br className="hidden md:block"/> Synthesis</h2>
                  <div className="space-y-8">
                     {steps.map((step, i) => (
                        <div key={i} className="flex gap-10 group">
                           <div className="text-3xl font-black text-gray-800 group-hover:text-indigo-400 transition-colors uppercase italic tabular-nums">{step.id}</div>
                           <div className="space-y-2">
                              <h4 className="text-xl font-bold uppercase tracking-tight text-white italic">{step.title}</h4>
                              <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-sm italic">{step.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="relative aspect-square md:aspect-video rounded-5xl bg-indigo-600 overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.3)] border-4 border-indigo-500/20 group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center grayscale mix-blend-overlay opacity-50 transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform transition-transform group-hover:scale-110">
                        <ArrowRight className="h-10 w-10 font-black" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <section className="relative py-48 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12 pb-32">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] italic">
            <span className="bg-linear-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">Stop Documenting.</span>
            <br />
            <span className="bg-linear-to-r from-indigo-400 to-rose-500 bg-clip-text text-transparent">Reclaim Flow.</span>
          </h2>

          <p className="text-2xl text-gray-500 font-medium max-w-2xl mx-auto italic">
            Ready to optimize your institutional intelligence cycle? Join the engineering teams defining the future of autonomy.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link to="/analysis">
              <Button size="lg" className="h-24 px-16 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-4xl hover:bg-gray-200 transition-all shadow-[0_50px_100px_-20px_rgba(255,255,255,0.3)] group italic">
                Launch Initial Scan
                <ArrowRight className="ml-4 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="pt-24 flex items-center justify-center gap-10">
             <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-12 w-12 rounded-full border-2 border-black bg-gray-900 flex items-center justify-center text-[10px] font-black text-gray-400">
                    A{i}
                  </div>
                ))}
             </div>
             <div className="text-left">
                <div className="flex items-center gap-1 pb-1">
                   {[1,2,3,4,5].map(i => <Sparkles key={i} className="h-3 w-3 text-emerald-400 fill-emerald-400" />)}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Trusted by 12,000+ Grid Nodes</div>
             </div>
          </div>
        </div>
      </section>
      
      <footer className="footer-fixed py-20 px-12 border-t border-gray-900 bg-black/80 backdrop-blur-xl w-full">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col gap-4">
               <span className="text-4xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                  CodeFlow.
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
               </span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic">The Context Layer for Engineering</span>
            </div>
            <div className="flex gap-16">
               <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                  <span className="text-white not-italic">Social</span>
                  <a href="#" className="hover:text-white transition-colors">Twitter</a>
                  <a href="#" className="hover:text-white transition-colors">GitHub</a>
               </div>
               <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                  <span className="text-white not-italic">Resources</span>
                  <Link to="/about" className="hover:text-white transition-colors">About</Link>
                  <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
               </div>
               <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                  <span className="text-white not-italic">Legal</span>
                  <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                  <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-gray-900/50 flex items-center justify-between text-[10px] font-black text-gray-800 uppercase tracking-widest italic">
            <div className="flex items-center gap-3">
               <Binary className="h-3 w-3 text-gray-800" />
               &copy; 2026 CodeFlow Labs Inc.
            </div>
            <span>Synthesized with &lt;3 in SF</span>
         </div>
      </footer>
    </div>
  )
}
