import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  MapPin, 
  MessageSquare, 
  Globe, 
  Send,
  Zap,
  ShieldCheck,
  Binary
} from "lucide-react"

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Logic for form submission
  }

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-purple-500/05 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pb-32"
      >
        <div className="space-y-12">
           <header className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic"
              >
                 /archive/communication-layer
              </motion.div>
              
              <div className="space-y-4">
                 <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight italic">
                    Establish <br /> <span className="not-italic text-gray-500">Contact</span>
                 </h1>
                 <p className="text-xl text-gray-500 font-medium italic max-w-lg leading-relaxed">
                    Initiate a high-bandwidth handshake with our architectural specialists for enterprise deployment and custom integration.
                 </p>
              </div>
           </header>

           <div className="space-y-6">
              {[
                { icon: Mail, label: "Neural Inbox", value: "hello@cortex.ai", color: "text-indigo-400" },
                { icon: MessageSquare, label: "Direct Buffer", value: "+1 (555) 012-3456", color: "text-purple-400" },
                { icon: MapPin, label: "Geospatial Index", value: "San Francisco, CA", color: "text-emerald-400" },
                { icon: Globe, label: "Logic Network", value: "cortex.ai/enterprise", color: "text-amber-400" }
              ].map((item, i) => (
                <motion.div 
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex items-center gap-6 p-6 rounded-3xl bg-gray-900/40 border border-gray-800 hover:border-indigo-500/20 transition-all shadow-xl"
                >
                  <div className="h-14 w-14 rounded-2xl bg-black border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                     <item.icon className={`h-6 w-6 ${item.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] italic">{item.label}</div>
                    <div className="text-lg font-black text-white italic tracking-tight">{item.value}</div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        <div className="relative group">
           <div className="absolute inset-x-0 -bottom-10 h-32 bg-indigo-500/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
           <div className="relative p-10 md:p-14 rounded-5xl bg-gray-900/40 border border-gray-800 backdrop-blur-3xl shadow-[0_40px_120px_-20px_rgba(79,70,229,0.25)] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />
              
              <form onSubmit={handleSubmit} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic ml-1">Identity: First</label>
                       <Input placeholder="Jane" className="h-16 px-6 bg-black/40 border-gray-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/40 text-white placeholder:text-gray-800 text-sm font-black italic rounded-xl shadow-inner uppercase tracking-widest transition-all" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic ml-1">Identity: Last</label>
                       <Input placeholder="Doe" className="h-16 px-6 bg-black/40 border-gray-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/40 text-white placeholder:text-gray-800 text-sm font-black italic rounded-xl shadow-inner uppercase tracking-widest transition-all" />
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic ml-1">Address: Digital</label>
                    <Input type="email" placeholder="jane@company.com" className="h-16 px-6 bg-black/40 border-gray-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/40 text-white placeholder:text-gray-800 text-sm font-black italic rounded-xl shadow-inner uppercase tracking-widest transition-all" />
                 </div>
                 
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic ml-1">Packet: Content</label>
                    <textarea 
                       className="w-full min-h-[160px] px-6 py-4 bg-black/40 border border-gray-800 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 outline-none text-white placeholder:text-gray-800 text-sm font-black italic rounded-xl shadow-inner uppercase tracking-widest transition-all resize-none custom-scrollbar" 
                       placeholder="Specify objective..." 
                    />
                 </div>

                 <Button type="submit" className="w-full h-20 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-4 italic active:scale-95 group/btn">
                    <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Dispatch Handshake
                 </Button>
              </form>
           </div>
        </div>
      </motion.div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            Handshake Buffer Active
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <ShieldCheck className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60">Verified Origin</span>
            </div>
            <div className="flex items-center gap-2">
               <Binary className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60">Handshake v4.2.0</span>
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
