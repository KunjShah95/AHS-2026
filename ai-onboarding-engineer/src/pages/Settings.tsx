import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Github, 
  Bell, 
  ShieldAlert, 
  Key, 
  Cpu, 
  Binary, 
  Settings as SettingsIcon,
  Fingerprint,
  Globe
} from "lucide-react"

export default function Settings() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900 px-2">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.3em] italic">
                 /archive/system-parameters
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Configuration <span className="not-italic text-gray-500">Core</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Adjust institutional parameters and neural handshake protocols.
              </p>
           </div>
           
           <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
              <SettingsIcon className="h-6 w-6 text-indigo-400" />
           </div>
        </header>

        <div className="space-y-8 px-2">
           {/* Source Control */}
           <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative group hover:border-indigo-500/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-500/40 to-transparent" />
              <CardHeader className="p-10 pb-0">
                 <CardTitle className="flex items-center gap-4 text-xl font-black uppercase italic tracking-tighter text-white">
                    <Github className="h-6 w-6 text-indigo-400" /> Source Control
                 </CardTitle>
                 <CardDescription className="text-gray-500 font-medium italic pt-2">Sync protocols for institutional repositories.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                 <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl bg-black/40 border border-gray-800 gap-6">
                    <div className="flex items-center gap-6">
                       <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-black shadow-2xl">
                          <Github className="h-6 w-6" />
                       </div>
                       <div className="space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-white italic">GitHub Gateway</div>
                          <div className="text-[10px] font-black uppercase text-emerald-500 italic tracking-widest flex items-center gap-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             Connected: @user
                          </div>
                       </div>
                    </div>
                    <Button variant="outline" className="h-10 px-6 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-[9px] font-black uppercase tracking-widest italic rounded-xl active:scale-95 transition-all">Disconnect</Button>
                 </div>

                 <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl bg-black/40 border border-gray-800 opacity-40 gap-6 grayscale">
                    <div className="flex items-center gap-6">
                       <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-2xl">
                          <Globe className="h-6 w-6" />
                       </div>
                       <div className="space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-widest text-white italic">GitLab Integration</div>
                          <div className="text-[10px] font-black uppercase text-gray-600 italic tracking-widest">Not Synchronized</div>
                       </div>
                    </div>
                    <Button variant="outline" className="h-10 px-6 border-gray-800 text-gray-500 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest italic rounded-xl">Initialize</Button>
                 </div>
              </CardContent>
           </Card>

           {/* API Access */}
           <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative group hover:border-indigo-500/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-purple-500/40 to-transparent" />
              <CardHeader className="p-10 pb-0">
                 <CardTitle className="flex items-center gap-4 text-xl font-black uppercase italic tracking-tighter text-white">
                    <Key className="h-6 w-6 text-purple-400" /> API Access
                 </CardTitle>
                 <CardDescription className="text-gray-500 font-medium italic pt-2">Neural keys for terminal and CI/CD handshake.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                 <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Cpu className="h-2 w-2 text-purple-400" />
                       </div>
                       <Input value="sk_live_512395812905812905812" readOnly className="h-14 pl-12 bg-black/40 border-gray-800 text-gray-500 font-mono text-[10px] rounded-xl shadow-inner focus-visible:ring-0 focus-visible:border-gray-800" />
                    </div>
                    <div className="flex gap-4">
                       <Button className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-gray-200 shadow-2xl italic active:scale-95 transition-all">Copy Key</Button>
                       <Button variant="destructive" className="h-14 px-8 bg-rose-600/10 border border-rose-500/20 text-rose-500 font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-rose-500/20 italic active:scale-95 transition-all">Revoke</Button>
                    </div>
                 </div>
                 <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.2em] italic px-1 flex items-center gap-2">
                    <ShieldAlert className="h-3 w-3 text-amber-500" />
                    Key exposure grants full architectural visibility to external agents.
                 </p>
              </CardContent>
           </Card>

           {/* Notifications */}
           <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative group hover:border-indigo-500/20 transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
              <CardHeader className="p-10 pb-0">
                 <CardTitle className="flex items-center gap-4 text-xl font-black uppercase italic tracking-tighter text-white">
                    <Bell className="h-6 w-6 text-emerald-400" /> Communication
                 </CardTitle>
                 <CardDescription className="text-gray-500 font-medium italic pt-2">Telemetry streaming and status alerts.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 divide-y divide-gray-800/50">
                 {[
                    { label: "Analysis synchronization", active: true },
                    { label: "Institutional velocity summary", active: true },
                    { label: "Neural protocol updates", active: false },
                    { label: "Critical vulnerability alerts", active: true }
                 ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-6 first:pt-0 last:pb-0 group/item">
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover/item:text-white transition-colors italic">{item.label}</span>
                       <div className={`h-6 w-12 rounded-full p-1 cursor-pointer transition-all duration-500 ${item.active ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-gray-900 border border-gray-800 grayscale'}`}>
                          <motion.div 
                            className="h-full w-4 bg-white rounded-full shadow-2xl"
                            animate={{ x: item.active ? 20 : 0 }}
                          />
                       </div>
                    </div>
                 ))}
              </CardContent>
           </Card>

           {/* Danger Zone */}
           <Card className="bg-rose-500/05 border border-rose-500/20 rounded-4xl overflow-hidden shadow-2xl group hover:bg-rose-500/10 transition-all">
              <CardHeader className="p-10 pb-0">
                 <CardTitle className="flex items-center gap-4 text-xl font-black uppercase italic tracking-tighter text-rose-500">
                    <ShieldAlert className="h-6 w-6" /> Institutional Purge
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="space-y-2 text-center md:text-left">
                    <div className="text-lg font-black text-rose-200 italic uppercase tracking-tighter">Liquidate Account Data</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 italic">This action initiates total neural entropy. Data cannot be recovered.</div>
                 </div>
                 <Button variant="destructive" className="h-14 px-10 bg-rose-600 text-white font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-rose-500 shadow-2xl italic active:scale-95 transition-all">Initiate Purge</Button>
              </CardContent>
           </Card>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              Parameter Sync Active
           </div>
           <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                 <Fingerprint className="h-3.5 w-3.5 text-gray-800" />
                 <span className="opacity-60 text-[9px] uppercase font-black">Archive: User Credentials</span>
              </div>
              <div className="flex items-center gap-2">
                 <Binary className="h-3.5 w-3.5 text-gray-800" />
                 <span className="opacity-60 font-black italic">Config v3.0.1</span>
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  )
}
