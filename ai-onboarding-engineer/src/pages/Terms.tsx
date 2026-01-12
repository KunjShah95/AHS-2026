import { motion } from "framer-motion"
import { Shield, BookOpen, Scale, FileText, Binary } from "lucide-react"

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-16 pb-32">
        <header className="text-center space-y-8 mb-20">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.3em] italic"
           >
              /archive/operational-protocols
           </motion.div>
           
           <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight italic">
                 Terms of <br /> <span className="not-italic text-gray-500">Service</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
                 The deterministic framework governing interaction with our autonomous agentic systems.
              </p>
           </div>
        </header>

        <section className="space-y-16">
           <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 italic mb-8">
              <Scale className="h-4 w-4" />
              Protocol v4.0.0 / Effective Jan 2026
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { icon: BookOpen, title: "1. Service Recognition", desc: "By accessing Cortex Research, you recognize that you are interacting with probabilistic autonomous systems. Outputs require human validation before production deployment." },
                { icon: Shield, title: "2. Security Standards", desc: "You grant temporary, read-only access for neural synthesis. We process artifacts ephemerally; code is converted into high-density vector representations." }
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-10 rounded-4xl bg-gray-900/40 border border-gray-800 space-y-6 group hover:border-indigo-500/20 transition-all shadow-2xl"
                >
                   <div className="h-12 w-12 rounded-2xl bg-black border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <item.icon className="h-6 w-6 text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{item.title}</h3>
                   <p className="text-gray-500 font-medium italic leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
           </div>

           <div className="space-y-12 pt-16 border-t border-gray-900">
              <article className="space-y-6">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">3. Liability Limitations</h2>
                 <p className="text-gray-500 font-medium italic leading-relaxed text-lg">
                    Cortex is provided "as is". We make no warranties regarding the deterministic accuracy of generated architectural maps or the safety of autonomous task sequences. You assume full sovereignty over any implementation decisions derived from these intelligence feeds.
                 </p>
              </article>

              <article className="space-y-6">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">4. Institutional Usage</h2>
                 <p className="text-gray-500 font-medium italic leading-relaxed text-lg">
                    Collectives utilizing the Service for commercial development with throughput exceeding $1M/year must utilize the Enterprise Gateway. This tier provides institutional-tier SLAs and specific data residency guarantees required for large-scale operations.
                 </p>
              </article>
           </div>
        </section>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            Governance Buffer Active
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <FileText className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60 text-[9px] uppercase font-black">Archive: Institutional Terms</span>
            </div>
            <div className="flex items-center gap-2">
               <Binary className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60">Legal Stack v2.2.0</span>
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
