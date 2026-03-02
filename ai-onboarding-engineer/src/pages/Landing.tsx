import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, Zap, Shield, Code2, Target, 
  Sparkles, Network,
  ChevronRight, BrainCircuit, Cpu, Layers,
  Compass, Gauge, Star, Check, Rocket
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
      highlights: ["SOC-II Certified", "AST Mastery"],
      color: "from-cyan-600/20"
    },
    {
      title: "Living Context Pathways",
      description: "Dynamic roadmaps that evolve with every commit. We transform unstructured institutional memory into learning vectors.",
      icon: Compass,
      highlights: ["Zero maintenance", "Adaptive UI"],
      color: "from-teal-600/20"
    },
    {
      title: "Architectural Tracer",
      description: "Visualize the institutional DNA of your code. Identify critical risk zones before they stall your sprint.",
      icon: Network,
      highlights: ["Real-time graph", "Risk Index"],
      color: "from-emerald-600/20"
    },
    {
      title: "Capability Analytics",
      description: "Enterprise dashboards. Quantify cohort progression and reclaim senior capacity through autonomous intelligence.",
      icon: Gauge,
      highlights: ["Predictive ROI", "Cohort Audit"],
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
            {/* Trust Badge */}
            <motion.div 
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <div className="w-px h-4 bg-white/20" />
              <span className="text-xs text-gray-300 font-medium">Trusted by 12,000+ engineering teams</span>
            </motion.div>

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
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Link to="/analysis">
                <Button 
                  size="lg" 
                  className="h-14 px-10 bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 group"
                >
                  Start Repository Scan
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-14 px-10 border-white/10 hover:bg-white/5 font-semibold"
                >
                  See How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Partner Logos */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Trusted by forward-thinking teams</div>
              <div className="flex flex-wrap gap-6 md:gap-10 justify-center items-center">
                {partners.map((partner, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + idx * 0.08 }}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors cursor-default"
                  >
                    <span className="text-cyan-500/70">{partner.icon}</span>
                    <span>{partner.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
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
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-white">The challenge:</span>
              {" "}
              <span className="text-cyan-300">onboarding</span>
              {" "}
              <span className="text-white">hasn't scaled with your</span>
              {" "}
              <span className="italic text-gray-400">engineering complexity</span>
            </h2>
            <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">
              Traditional approaches leave new engineers waiting weeks for context. We solve that in 3 weeks—permanently.
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
              >
                <Card variant="minimal" className="p-8 text-left h-full">
                  <p className="text-gray-300 text-lg font-light italic leading-relaxed mb-6">
                    "{item.quote}"
                  </p>
                  <p className="text-gray-500 text-sm font-medium">
                    — {item.attribution}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative py-20 px-6 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="relative group"
              >
                <Card variant="minimal" className="p-6 md:p-8 text-center">
                  <div className="text-3xl md:text-5xl font-bold mb-2 text-white tabular-nums">
                    {stat.value.split(" ")[0]}
                    <span className="text-2xl md:text-3xl text-gray-500">{stat.value.includes(" ") ? " " + stat.value.split(" ")[1] : ""}</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-4 font-medium">{stat.label}</div>
                  <div className="flex items-center justify-center">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-20 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="accent" className="mx-auto">
              <Sparkles className="h-3 w-3" />
              Core Capabilities
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-white">Built for</span>
              {" "}
              <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Industrial Scale
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Military-grade infrastructure designed to handle the most complex architectural scenarios
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                whileHover={{ y: -4 }}
              >
                <Card 
                  variant="glow"
                  className="p-8 h-full flex flex-col relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                    backgroundImage: `linear-gradient(135deg, ${idx % 2 === 0 ? 'rgba(6, 182, 212, 0.05)' : 'rgba(34, 197, 94, 0.05)'} 0%, transparent 100%)`
                  }} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <motion.div 
                      className="h-12 w-12 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                      whileHover={{ scale: 1.1 }}
                    >
                      <feature.icon className="h-6 w-6 text-primary" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-base mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                      {feature.highlights.map((highlight, hIdx) => (
                        <Badge key={hIdx} variant="outline" size="sm">
                          <Check className="h-3 w-3 mr-1" />
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="relative py-32 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column */}
            <motion.div 
              className="space-y-12"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="space-y-4">
                <Badge variant="accent" className="w-fit">
                  <Rocket className="h-3 w-3" />
                  The Protocol
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="text-white">Context</span>
                  {" "}
                  <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                    Synthesis
                  </span>
                </h2>
              </div>

              {/* Steps */}
              <div className="space-y-8">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    className="flex gap-8 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 border border-primary/30 group-hover:scale-110 transition-transform">
                        <span className="text-lg font-bold text-primary">{step.id}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-gray-400 text-base leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-primary/20">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-transparent to-teal-600/20" />
                
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Center visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="relative w-48 h-48"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    {/* Rotating rings */}
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-cyan-500/20"
                        style={{ 
                          width: `${100 - i * 25}%`,
                          height: `${100 - i * 25}%`,
                          left: `${i * 12.5}%`,
                          top: `${i * 12.5}%`
                        }}
                      />
                    ))}
                    
                    {/* Center dot */}
                    <motion.div 
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 blur-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="text-white">Stop documenting.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                Reclaim flow.
              </span>
            </h2>

            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
              Join the engineering teams defining the future of autonomous onboarding. Start your 3-week transformation today.
            </p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link to="/analysis">
                <Button 
                  size="xl" 
                  className="h-14 px-12 bg-white text-black font-semibold hover:bg-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 group"
                >
                  Launch Initial Scan
                  <Rocket className="ml-2 h-5 w-5 group-hover:translate-y-0 group-hover:scale-110 transition-all" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button 
                  size="xl"
                  variant="outline"
                  className="h-14 px-12 border-white/10 hover:bg-white/5"
                >
                  View Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
