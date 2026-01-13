import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, Zap, Shield, Code2, Target, 
  Sparkles, Network,
  ChevronRight, BrainCircuit, Cpu, Layers,
  Compass, Gauge, Star
} from "lucide-react"

// Aurora Wave Background Component
function AuroraBackground() {
  return (
    <div className="aurora-container">
      <div className="aurora-wave aurora-wave-1" />
      <div className="aurora-wave aurora-wave-2" />
      <div className="aurora-wave aurora-wave-3" />
      <div className="aurora-glow" />
    </div>
  )
}

export default function Landing() {
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const stats = [
    { value: "6 mo → 3 wk", label: "Onboarding Scale", icon: Target, color: "text-cyan-400" },
    { value: "153K+", label: "Productivity Yield", icon: Sparkles, color: "text-teal-400" },
    { value: "12K+", label: "Neural Audits", icon: Code2, color: "text-emerald-400" },
    { value: "99.99%", label: "Grid Stability", icon: Shield, color: "text-cyan-400" }
  ]

  const partners = [
    { name: "AURIQ", icon: "◇" },
    { name: "LOFTPQ", icon: "◈" },
    { name: "NIMBLE", icon: "◆" },
    { name: "ECHO", icon: "●" },
    { name: "POLAR", icon: "◐" },
    { name: "CIRCUIT", icon: "◎" }
  ]

  const features = [
    {
      title: "Neural Repository Synthesis",
      description: "Industrial-grade AST parsing with multi-layer dependency mapping. Our engines resolve architectural intent where traditional tools see only files.",
      icon: Cpu,
      metrics: ["SOC-II Certified", "AST Mastery"],
      color: "from-cyan-600/20"
    },
    {
      title: "Living Context Pathways",
      description: "Dynamic roadmaps that evolve with every commit. We transform unstructured institutional memory into high-bandwidth learning vectors.",
      icon: Compass,
      metrics: ["Zero maintenance", "Adaptive UI"],
      color: "from-teal-600/20"
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
      color: "from-cyan-600/20"
    }
  ]

  const steps = [
    { id: "01", title: "Map Artifacts", desc: "Initialize a high-fidelity scan of your core repository clusters.", icon: Layers },
    { id: "02", title: "Resolve Context", desc: "Our neural engine synthesizes institutional knowledge and logic flows.", icon: BrainCircuit },
    { id: "03", title: "Compress Time", desc: "Deployment of custom pathways to new hires, reclaiming institutional velocity.", icon: Zap }
  ]

  const testimonials = [
    { quote: "Traditional onboarding is just for recruiters, not engineers.", attribution: "Engineering Lead, Series B Startup" },
    { quote: "We post once in a while and nothing happens. CodeFlow changed that.", attribution: "CTO, Fortune 500" }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Aurora Wave Background */}
      <AuroraBackground />
      
      {/* Mouse-following gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(6, 182, 212, 0.15), transparent 40%)`
        }}
      />
      
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[60px_60px]" />
      </div>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 md:px-8 pt-32 pb-20">
        <div className="max-w-7xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center relative z-20"
          >
            {/* Star Rating Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <div className="w-px h-4 bg-white/20" />
              <span className="text-xs text-gray-300 font-medium">Our Freight Forwarders bring up to 100% to revenue</span>
            </div>

            {/* Main Headline with Mixed Styling */}
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-medium mb-8 leading-[1.05] tracking-tight">
              <span className="text-white">
                Turn{" "}
              </span>
              <span className="bg-linear-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent font-semibold">
                6-month ramps
              </span>
              <span className="text-white">
                {" "}and{" "}
              </span>
              <span className="italic text-cyan-400 font-light">
                context chaos
              </span>
              <span className="text-white">
                {" "}into
              </span>
              <br />
              <span className="text-white">
                steady{" "}
              </span>
              <span className="bg-linear-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent font-semibold">
                engineering velocity
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
              We build you a production-grade onboarding engine in <span className="text-cyan-400 underline decoration-cyan-400/30 underline-offset-4">3 clinical weeks</span> that brings
              <br className="hidden md:block" />
              <span className="text-gray-300">10-40 qualified new hires</span> every month, with autonomous context delivery
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link to="/analysis">
                <Button className="h-14 px-8 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] group flex items-center gap-3">
                  Book a 20-minute Pipeline Audit
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="h-14 px-8 bg-transparent border border-white/20 text-white font-medium text-sm rounded-xl hover:bg-white/5 hover:border-white/30 transition-all">
                  See how the system works
                </Button>
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="text-xs text-gray-500 mb-12">
              You're in good hands
            </div>

            {/* Partner Logos */}
            <div className="flex flex-wrap gap-8 md:gap-12 justify-center items-center text-gray-500">
              {partners.map((partner, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-2 text-sm font-medium hover:text-gray-300 transition-colors cursor-default"
                >
                  <span className="text-cyan-500/60">{partner.icon}</span>
                  <span>{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM STATEMENT SECTION */}
      <section className="relative py-32 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
              If your pipeline depends on{" "}
              <span className="italic text-cyan-400 font-light">referrals</span>
              {" "}and{" "}
              <span className="italic text-cyan-400 font-light">random outreach</span>
              <span className="text-gray-400">,</span>
              {" "}you
              <br />
              are{" "}
              <span className="relative">
                <span className="text-amber-400 underline decoration-amber-400/50 underline-offset-4 decoration-wavy">exposed</span>
              </span>
            </h2>
            <p className="text-gray-500 text-lg font-medium">
              Most engineering teams tell us:
            </p>
          </motion.div>

          {/* Testimonial Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-4xl mx-auto">
            {testimonials.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-white/2 border border-white/5 rounded-2xl text-left hover:bg-white/4 hover:border-white/10 transition-all group"
              >
                <p className="text-gray-300 text-lg font-light italic leading-relaxed mb-4">
                  "{item.quote}"
                </p>
                <p className="text-gray-600 text-sm">
                  — {item.attribution}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative py-20 px-6 bg-linear-to-b from-transparent via-cyan-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 text-white tabular-nums tracking-tight bg-linear-to-b from-white to-gray-400 bg-clip-text">
                  {stat.value}
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-gray-500 flex items-center justify-center gap-2">
                   <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                   {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Core Fabric</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
              Built for{" "}
              <span className="bg-linear-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Industrial Scale
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative p-10 bg-linear-to-br ${feature.color} to-transparent border border-white/5 rounded-3xl hover:border-cyan-500/30 transition-all overflow-hidden`}
              >
                <div className="relative z-10">
                   <div className="h-14 w-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-cyan-500/30 transition-all">
                      <feature.icon className="h-7 w-7 text-cyan-400" />
                   </div>
                   <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-cyan-300 transition-colors">
                     {feature.title}
                   </h3>
                   <p className="text-gray-400 text-base mb-8 leading-relaxed font-light">
                     {feature.description}
                   </p>
                   <div className="flex gap-3 pt-6 border-t border-white/5">
                     {feature.metrics.map((metric, mIdx) => (
                       <div key={mIdx} className="text-xs font-medium text-cyan-400 uppercase tracking-wide px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
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

      {/* HOW IT WORKS SECTION */}
      <section className="relative py-32 bg-linear-to-b from-cyan-950/20 via-black to-black border-y border-white/5 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
               <div className="space-y-12">
                  <div className="space-y-4">
                    <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">The Protocol</div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                      Context{" "}
                      <span className="bg-linear-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                        Synthesis
                      </span>
                    </h2>
                  </div>
                  <div className="space-y-8">
                     {steps.map((step, i) => (
                        <motion.div 
                          key={i} 
                          className="flex gap-8 group"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 }}
                        >
                           <div className="text-3xl font-semibold text-gray-700 group-hover:text-cyan-400 transition-colors tabular-nums">{step.id}</div>
                           <div className="space-y-2">
                              <h4 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">{step.title}</h4>
                              <p className="text-gray-500 text-sm leading-relaxed max-w-sm font-light">{step.desc}</p>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </div>
               <motion.div 
                 className="relative aspect-4/3 rounded-3xl bg-linear-to-br from-cyan-600 to-teal-700 overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.2)] border border-cyan-500/20 group"
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
               >
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center grayscale mix-blend-overlay opacity-40 transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform transition-all group-hover:scale-110 group-hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]">
                        <ArrowRight className="h-8 w-8" />
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-10 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-medium tracking-tight leading-[1.1]">
              <span className="text-white">Stop Documenting.</span>
              <br />
              <span className="bg-linear-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Reclaim Flow.
              </span>
            </h2>

            <p className="text-xl text-gray-500 font-light max-w-2xl mx-auto mt-8">
              Ready to optimize your institutional intelligence cycle? Join the engineering teams defining the future of autonomy.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-10">
              <Link to="/analysis">
                <Button className="h-16 px-12 bg-white text-black font-semibold text-sm rounded-2xl hover:bg-gray-100 transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.25)] group">
                  Launch Initial Scan
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="pt-16 flex items-center justify-center gap-8">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-black bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xs font-semibold text-gray-400">
                      A{i}
                    </div>
                  ))}
               </div>
               <div className="text-left">
                  <div className="flex items-center gap-0.5 pb-1">
                     {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 text-cyan-400 fill-cyan-400" />)}
                  </div>
                  <div className="text-xs font-medium text-gray-600">Trusted by 12,000+ Grid Nodes</div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
