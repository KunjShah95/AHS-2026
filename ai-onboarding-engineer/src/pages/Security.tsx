import { motion } from "framer-motion"
import { ShieldAlert, Lock, FileKey, Server, ShieldCheck, Binary, Cpu, Fingerprint } from "lucide-react"

export default function Security() {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-24 pb-32">
        <header className="text-center space-y-8 mb-20">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.3em] italic"
           >
              /archive/defense-layer
           </motion.div>
           
           <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight italic">
                 Institutional <br /> <span className="not-italic text-gray-500">Integrity</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
                 High-fidelity security protocols designed for zero-trust architectural analysis.
              </p>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
             {[
               { 
                 icon: Lock, 
                 title: "Ephemeral Analysis", 
                 desc: "Code repositories are cloned into isolated, ephemeral containers. Once neural synthesis is complete, the logic buffer is purged with 100% entropy guarantee.",
                 color: "text-indigo-400"
               },
               { 
                 icon: ShieldAlert, 
                 title: "Zero-Trust Architecture", 
                 desc: "Models are never trained on your intellectual property. Our intelligence layer operates solely on high-density vector representations in secure memory space.",
                 color: "text-rose-400"
               },
               { 
                 icon: FileKey, 
                 title: "SOC 2 Type II Certified", 
                 desc: "Subject to continuous auditing across security, parity, and confidentiality vectors. Institutional transparency through automated proof-of-integrity.",
                 color: "text-emerald-400"
               }
             ].map((item, i) => (
               <motion.div 
                 key={item.title}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="p-10 rounded-4xl bg-gray-900/40 border border-gray-800 space-y-6 group hover:border-indigo-500/20 transition-all shadow-2xl flex flex-col items-center text-center"
               >
                  <div className="h-14 w-14 rounded-2xl bg-black border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                     <item.icon className={`h-6 w-6 ${item.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{item.title}</h3>
                  <p className="text-gray-500 font-medium italic leading-relaxed">{item.desc}</p>
               </motion.div>
             ))}
        </div>

        <div className="p-12 md:p-20 rounded-5xl bg-indigo-600/05 border border-indigo-500/10 relative overflow-hidden group shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)]">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black italic text-indigo-300 uppercase tracking-widest">
                    <Server className="h-3.5 w-3.5" />
                    Infrastructure Hardening
                 </div>
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Advanced Data Residency</h2>
                 <p className="text-gray-500 font-medium italic text-lg leading-relaxed">
                    Enterprise collectives can specify regional index coordination (US, EU, APAC) to satisfy global compliance mandates. All vector data is isolated within cryptographically separated tenants.
                 </p>
                 <div className="flex flex-wrap gap-4">
                    {['AES-256', 'TLS 1.3', 'HSM Keys', 'SOC2'].map(tag => (
                      <div key={tag} className="px-4 py-2 rounded-xl bg-black/40 border border-gray-800 text-[10px] font-black uppercase tracking-[0.2em] italic text-gray-600 group-hover:text-indigo-400 transition-colors">
                         {tag}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 {[
                   { icon: Cpu, label: "Isolative Layer" },
                   { icon: Fingerprint, label: "Identity Sync" },
                   { icon: ShieldCheck, label: "Audit Stream" },
                   { icon: Binary, label: "Neural Shield" }
                 ].map((box, i) => (
                   <div key={i} className="p-8 rounded-4xl bg-black/40 border border-gray-800 flex flex-col items-center justify-center gap-4 group/box hover:border-indigo-500/20 transition-all shadow-inner">
                      <box.icon className="h-8 w-8 text-gray-800 group-hover/box:text-indigo-400 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic group-hover/box:text-gray-400">{box.label}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            Security Shield Active
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <ShieldCheck className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60 text-[9px] uppercase font-black">Archive: Institutional Defense</span>
            </div>
            <div className="flex items-center gap-2">
               <Binary className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60">Security Stack v2.6.0</span>
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
