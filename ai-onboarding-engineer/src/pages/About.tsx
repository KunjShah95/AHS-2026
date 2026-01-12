import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Zap, Heart, Sparkles, ArrowRight, Github, Linkedin, Mail } from "lucide-react"

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto space-y-32">
        <header className="space-y-12 text-center md:text-left">
           <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
              /archive/about-manifesto
           </div>
           <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none italic">
             Our <br className="hidden md:block" /> <span className="text-gray-500 not-italic">Genesis</span>
           </h1>
           <p className="text-xl md:text-2xl text-gray-500 font-medium italic max-w-3xl leading-relaxed">
             CodeFlow was engineered with a singular objective: to eliminate the biological bottlenecks in institutional knowledge ingestion.
           </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
           {[
             { title: "Precision", desc: "No second-guessing. Every line of code mapped, every dependency resolved.", icon: ShieldCheck },
             { title: "Velocity", desc: "Ramp-up timelines compressed from months to clinical hours.", icon: Zap },
             { title: "Integrity", desc: "Built by developers who believe in architectural purity and documentation as code.", icon: Heart }
           ].map((item, i) => (
             <div key={i} className="space-y-6 group">
                <div className="h-16 w-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:border-indigo-500/30 transition-all shadow-inner">
                   <item.icon className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">{item.title}</h3>
                <p className="text-gray-500 italic leading-relaxed font-medium">{item.desc}</p>
             </div>
           ))}
        </section>

        <section className="space-y-16">
           <div className="flex items-center gap-4 px-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic">Institutional Collective</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  name: "Varad Vekariya", 
                  role: "Architectural Lead", 
                  bio: "Pioneer in structural intelligence and node scalability.",
                  link: "https://www.linkedin.com/in/varad-vekariya/",
                  img: "uploaded_image_0_1768079162675.jpg"
                },
                { 
                  name: "Kunj Shah", 
                  role: "Systems Designer", 
                  bio: "Expert in knowledge liquidity and human-node integration.",
                  link: "https://www.linkedin.com/in/kunjshah05/",
                  img: "uploaded_image_1_1768079162675.jpg"
                }
              ].map((member, i) => (
                <Card key={i} className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden hover:border-indigo-500/20 transition-all group shadow-2xl">
                   <CardContent className="p-0 flex flex-col md:flex-row h-full">
                      <div className="w-full md:w-48 h-64 md:h-auto overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                         <img src={member.img} alt={member.name} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" />
                      </div>
                      <div className="flex-1 p-10 space-y-6 flex flex-col justify-center">
                         <div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter italic">{member.name}</h4>
                            <div className="text-[10px] uppercase font-black text-indigo-400 tracking-widest mt-1 italic">{member.role}</div>
                         </div>
                         <p className="text-sm text-gray-500 italic leading-relaxed">{member.bio}</p>
                         <a 
                           href={member.link} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 hover:text-white transition-colors"
                         >
                            Establish Link <ArrowRight className="h-3 w-3" />
                         </a>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </section>

        <section className="p-16 md:p-32 rounded-5xl bg-gray-900/60 border border-indigo-500/20 text-center space-y-14 shadow-[0_40px_120px_-20px_rgba(79,70,229,0.3)] backdrop-blur-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase max-w-4xl mx-auto leading-none italic">
             Reclaim Your <br className="hidden md:block" /> Latent Velocity.
           </h2>
           <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-6">
              <button className="h-20 px-16 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl italic">
                 Initialize Onboarding
              </button>
              <button className="h-20 px-16 bg-transparent border border-gray-800 text-white font-black rounded-2xl hover:bg-white/5 transition-all uppercase tracking-[0.2em] text-xs italic">
                 Schedule Analysis
              </button>
           </div>
        </section>

        <footer className="py-20 border-t border-gray-900 bg-transparent flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="flex flex-col gap-6 items-center md:items-start">
              <div className="text-3xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                 CodeFlow.
                 <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-700 italic">Structural Intelligence Layer</p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2 italic">
                 <Github className="h-3 w-3" /> Artifacts
              </a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2 italic">
                 <Linkedin className="h-3 w-3" /> Network
              </a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-2 italic">
                 <Mail className="h-3 w-3" /> Gateway
              </a>
           </div>
        </footer>
      </div>
    </div>
  )
}
