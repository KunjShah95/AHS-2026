/*
BILLION: Worth $1B because it visualizes the invisible architecture of code, solving the #1 pain point of engineering scaling: context transfer.
DIRECTION: Deep Engineering / Retro-Future / Editorial
SIGNATURE: Living Code Scanner above fold
ESCAPE: AI-slop uses purple gradients and centered text. I use deep navy, structured grids, and functional visualizations.
LOCKED: Deep Engineering / Scanner
*/

import { useState, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { Terminal, Cpu, Network, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

import heroImg from "@/assets/images/hero.png"
import featureImg from "@/assets/images/feature.png"

// --- ASSETS ---
const HERO_IMG = heroImg
const FEATURE_IMG = featureImg

export default function Landing() {
  const [scanned, setScanned] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])

  // Mock code for scanner interaction
  const codeSnippet = `class OnboardingAgent(Agent):
    def analyze_repo(self, repo_url: str):
        """Extracts architectural DNA."""
        graph = self.graph_builder.build(repo_url)
        context = self.semantic_search.index(graph)
        return context.generate_roadmap()`

  return (
    <div className="flex flex-col w-full bg-background text-foreground overflow-hidden">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen min-h-[800px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={HERO_IMG} 
            alt="Neural Network Code Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/50 to-background" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
          
          {/* Left: Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center space-x-2 border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-mono text-primary tracking-wider uppercase"> Onboarding Engineer</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight leading-[1.1]">
              Onboard engineers <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-white to-primary/50">
                at the speed of AI.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground/80 max-w-lg font-light leading-relaxed">
              Stop burning months on context transfer. Our autonomous agent reads your codebase, builds a mental model, and tutors your new hires instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-none border-l-2 border-white/20 transition-all hover:pl-10 group" asChild>
                <Link to="/analysis">
                  Deploy Onboarding Agent
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 hover:bg-white/5 rounded-none backdrop-blur-sm">
                <Play className="mr-2 h-4 w-4" /> Watch Demo
              </Button>
            </div>

            <div className="pt-8 flex items-center gap-6 text-sm text-muted-foreground font-mono">
              <div>// SOC2 Compliance</div>
              <div>// Enterprise Ready</div>
              <div>// 100+ Languages</div>
            </div>
          </motion.div>

          {/* Right: Signature Interactive Scanner */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2, duration: 0.8 }}
             className="relative hidden lg:block"
          >
            <div 
              className="relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 overflow-hidden shadow-2xl group"
              onMouseEnter={() => setScanned(true)}
              onMouseLeave={() => setScanned(false)}
            >
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <div className="ml-4 font-mono text-xs text-muted-foreground">agent_core.py</div>
              </div>

              <pre className="font-mono text-sm text-slate-300 overflow-x-auto">
                <code>{codeSnippet}</code>
              </pre>

              {/* Scanning Beam */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-primary shadow-[0_0_20px_2px_rgba(251,191,36,0.5)] z-20"
              />
              <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none mix-blend-overlay" />

              {/* Floating Extracted Nodes (simulated) */}
              <AnimatePresence>
                {scanned && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 120, y: -20 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="absolute top-1/2 right-10 bg-card border border-primary/30 p-3 rounded-lg shadow-lg z-30"
                    >
                      <Network className="h-6 w-6 text-primary mb-1" />
                      <div className="text-[10px] font-mono text-primary">Graph Built</div>
                    </motion.div>

                     <motion.div 
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 80, y: 40 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: 0.1 }}
                      className="absolute top-1/2 right-10 bg-card border border-primary/30 p-3 rounded-lg shadow-lg z-30"
                    >
                      <Cpu className="h-6 w-6 text-accent mb-1" />
                      <div className="text-[10px] font-mono text-accent">Logic Parsed</div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- SOCIAL PROOF STRIP --- */}
      <div className="w-full border-y border-white/5 bg-black/20 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Placeholder Logos - Font based for now */}
          {['ACME Corp', 'Stripe', 'Vercel', 'Linear', 'Raycast'].map(brand => (
            <span key={brand} className="text-xl font-display font-semibold tracking-wider">{brand}</span>
          ))}
        </div>
      </div>

      {/* --- PROBLEM / SOLUTION PARALLAX --- */}
      <section ref={targetRef} className="py-32 w-full relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-display font-medium mb-6">
                Your documentation is <span className="text-destructive decoration-wavy underline">stale</span>. <br/>
                Your senior devs are <span className="text-destructive decoration-wavy underline">busy</span>.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                The average engineer takes 3 months to become fully productive. That's a quarter of a year of salary burned on "figuring it out". 
                <br/><br/>
                AI Onboarding Engineer changes the physics of learning. It doesn't just read code; it understands <strong>intent, architecture, and flow</strong>.
              </p>
              
               <ul className="space-y-4 font-mono text-sm">
                {['Zero setup time', 'Connects to GitHub/GitLab', 'Instant answers to "Where is X defined?"'].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div style={{ opacity, scale }} className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
               <img src={FEATURE_IMG} alt="Architecture Graph" className="absolute inset-0 w-full h-full object-cover" />
               <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                     <div>
                        <div className="text-sm font-semibold text-white">Live Architecture Map</div>
                        <div className="text-xs text-muted-foreground">Generated in 1.4s</div>
                     </div>
                     <Terminal className="h-5 w-5 text-primary" />
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 bg-secondary/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
           <div className="mb-20">
              <h2 className="text-3xl font-display font-medium mb-4">Engineered for Engineers</h2>
              <div className="h-1 w-20 bg-primary" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Semantic Search", desc: "Don't grep. Ask. Our vector engine understands code concepts, not just strings.", icon: <Terminal /> },
                { title: "Task Generation", desc: "Generate safe, introductory tickets that touch specific specialized systems.", icon: <Cpu /> },
                { title: "Architecture Viz", desc: "See the forest and the trees. Zoom from system view to function view instantly.", icon: <Network /> }
              ].map((f, i) => (
                <div key={i} className="group p-8 rounded-none border border-white/5 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-300">
                   <div className="mb-6 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      {f.icon}
                   </div>
                   <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                   <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
           <h2 className="text-5xl md:text-6xl font-display font-medium mb-8 tracking-tight">
             Ready to onboard?
           </h2>
           <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
             Join 4,000+ engineering teams who have stopped the "three month ramp-up" madness.
           </p>
           <Button size="lg" className="h-16 px-12 text-lg bg-foreground text-background hover:bg-white/90 rounded-full" asChild>
              <Link to="/analysis">Get Started Now</Link>
           </Button>
        </div>
      </section>

    </div>
  )
}
