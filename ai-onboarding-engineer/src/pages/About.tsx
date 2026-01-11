/*
BILLION: Clean narrative about the mission.
DIRECTION: Editorial / Human
SIGNATURE: Mission Statement
*/

import kunjImg from '../assets/images/kunj.jpeg';
import varadImg from '../assets/images/varad.jpeg';

export default function About() {
  return (
    <div className="min-h-screen bg-background py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-24">
        
        {/* Mission */}
        <div className="space-y-8 text-center md:text-left">
           <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight">
             We believe 3 months is <br/>
             <span className="text-primary italic">too long</span> to wait.
           </h1>
           <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
             The industry standard for engineering ramp-up is 90 days. For those 90 days, your senior engineers are distracted, your new hires are frustrated, and your velocity suffers.
           </p>
           <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
             We built Cortex to solve the "Context Problem". By automating the transfer of tribal knowledge, we unlock the potential of every engineer, from day one.
           </p>
        </div>

        {/* The Team placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-24">
           <div>
              <h2 className="text-2xl font-bold mb-4">Built by Engineers.</h2>
              <p className="text-muted-foreground">
                We are a team of ex-FAANG engineers who were tired of spending our first weeks at new jobs reading outdated Confluence pages.
              </p>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <a 
                href="https://www.linkedin.com/in/kunjshah05/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                 <img 
                   src={kunjImg} 
                   alt="Kunj Shah" 
                   className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                 />
                 <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/0 to-transparent p-4 flex flex-col justify-end">
                    <span className="font-mono text-sm font-bold text-white">Kunj Shah</span>
                    <span className="text-xs text-white/70">Founder</span>
                 </div>
              </a>
               <a 
                 href="https://www.linkedin.com/in/varad-vekariya/" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="group relative aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden"
               >
                 <img 
                   src={varadImg} 
                   alt="Varad Vekariya" 
                   className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                 />
                 <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/0 to-transparent p-4 flex flex-col justify-end">
                    <span className="font-mono text-sm font-bold text-white">Varad Vekariya</span>
                    <span className="text-xs text-white/70">Founding Engineer</span>
                 </div>
              </a>
           </div>
        </div>

      </div>
    </div>
  )
}
