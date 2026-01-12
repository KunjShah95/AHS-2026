import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  HelpCircle, 
  AlertTriangle, 
  Search, 
  Plus, 
  Compass,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getTeamMemory } from '@/lib/advanced-features-db';
import type { TeamMemory } from '@/lib/types/advanced-features';

export default function TeamMemoryView() {
  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState<TeamMemory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'faqs' | 'mistakes' | 'paths'>('faqs');

  const loadMemory = useCallback(async () => {
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      const data = await getTeamMemory(repoId);
      setMemory(data);
    } catch (error) {
      console.error('Error loading team memory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Accessing Institutional Memory Banks...</span>
      </div>
    );
  }

  const filteredFAQs = memory?.faqs.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
                 /arch/institutional-memory
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Team <span className="not-italic text-gray-500">Memory</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Global institutional intelligence cluster. Capturing tribal knowledge and recurrent solving patterns.
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex bg-gray-900/60 p-1.5 rounded-2xl border border-gray-800">
                 {(['faqs', 'mistakes', 'paths'] as const).map((tab) => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       activeTab === tab 
                         ? 'bg-white text-black shadow-2xl' 
                         : 'text-gray-600 hover:text-white'
                     }`}
                   >
                     {tab}
                   </button>
                 ))}
              </div>
              <Button className="h-12 w-12 p-0 bg-indigo-500 text-white rounded-2xl shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center">
                 <Plus className="h-5 w-5" />
              </Button>
           </div>
        </header>

        <div className="relative group">
           <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-700 group-focus-within:text-indigo-500 transition-colors">
              <Search className="h-5 w-5" />
           </div>
           <Input 
             placeholder="Search Institutional Neural Network..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="h-20 bg-gray-900/40 border-gray-800 text-xl font-black italic rounded-4xl pl-16 pr-8 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700"
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                 {activeTab === 'faqs' && (
                   <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                      {filteredFAQs.map((faq) => (
                        <Card key={faq.id} className="bg-gray-900/40 border border-gray-800 rounded-4xl group hover:border-indigo-500/20 transition-all overflow-hidden">
                           <CardContent className="p-10 space-y-6">
                              <div className="flex items-start justify-between">
                                 <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase group-hover:text-indigo-400 transition-colors leading-tight">
                                    {faq.question}
                                 </h3>
                                 <Badge variant="outline" className="bg-indigo-500/05 border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest px-3 py-1 italic rounded-full shrink-0">
                                    {faq.category}
                                 </Badge>
                              </div>
                              <p className="text-gray-400 italic font-medium leading-relaxed max-w-3xl">
                                 {faq.answer}
                              </p>
                              <div className="flex items-center gap-6 pt-6 border-t border-gray-800/50">
                                 <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                                    <RefreshCw className="h-3 w-3" />
                                    Frequency: {faq.frequency}
                                 </div>
                                 <div className="flex flex-wrap gap-2 text-[10px] font-mono text-gray-800 uppercase italic">
                                    {faq.relatedFiles.slice(0, 2).map((file, i) => (
                                      <span key={i} className="hover:text-indigo-400 transition-colors pointer-events-none">~/ {file}</span>
                                    ))}
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                      ))}
                   </motion.div>
                 )}

                 {activeTab === 'mistakes' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                       {memory?.commonMistakes.map((mistake) => (
                         <Card key={mistake.id} className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-rose-500/20 transition-all">
                            <div className="p-8 border-b border-gray-800/50 flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-2xl bg-rose-500/05 border border-rose-500/10 flex items-center justify-center">
                                     <AlertTriangle className="h-5 w-5 text-rose-500" />
                                  </div>
                                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white">{mistake.description}</h3>
                               </div>
                               <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-[9px] uppercase tracking-widest italic rounded-full px-3 py-1">
                                  {mistake.severity} Risk
                               </Badge>
                            </div>
                            <CardContent className="p-8 space-y-8">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                     <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Institutional Context</div>
                                     <p className="text-sm font-medium italic text-gray-500 leading-relaxed bg-black/40 p-6 rounded-2xl border border-gray-800">{mistake.context}</p>
                                  </div>
                                  <div className="space-y-3">
                                     <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Remediation Node</div>
                                     <p className="text-sm font-medium italic text-emerald-400/80 leading-relaxed bg-emerald-500/05 p-6 rounded-2xl border border-emerald-500/10">{mistake.solution}</p>
                                  </div>
                               </div>
                            </CardContent>
                         </Card>
                       ))}
                    </motion.div>
                 )}

                 {activeTab === 'paths' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {memory?.learningPaths.map((path) => (
                         <Card key={path.id} className="bg-gray-900/40 border border-gray-800 rounded-4xl p-8 group hover:border-indigo-500/20 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                               <Compass className="h-16 w-16 text-white" />
                            </div>
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic mb-2">Validated Experience Node</div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mb-6 leading-tight">{path.name}</h3>
                            <div className="space-y-4">
                               {path.steps.map((step, i) => (
                                 <div key={i} className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-gray-800 group-hover:bg-indigo-500 transition-colors" />
                                    <span className="text-xs font-medium italic text-gray-500 group-hover:text-gray-300 transition-colors">{step}</span>
                                 </div>
                               ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-800/50 flex items-center justify-between">
                               <div className="text-2xl font-black text-white italic tabular-nums">{path.successRate}% <span className="text-[9px] uppercase font-bold text-gray-700 tracking-widest not-italic ml-2">Success Rate</span></div>
                               <Button size="sm" className="bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-xl px-4 italic hover:bg-gray-200 transition-all underline underline-offset-4">Trace Node</Button>
                            </div>
                         </Card>
                       ))}
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 px-2 italic">Institutional History</div>
              <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl">
                 <CardContent className="p-8 space-y-8">
                    {[
                      { icon: HelpCircle, label: "Neural queries recorded", val: filteredFAQs.length },
                      { icon: AlertTriangle, label: "Success inhibitors identified", val: memory?.commonMistakes.length || 0 },
                      { icon: Compass, label: "Validated clusters mapped", val: memory?.learningPaths.length || 0 }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-6">
                         <div className="h-10 w-10 rounded-2xl bg-black border border-gray-800 flex items-center justify-center text-indigo-400">
                            <item.icon className="h-5 w-5" />
                         </div>
                         <div>
                            <div className="text-2xl font-black text-white italic tabular-nums">{item.val}</div>
                            <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">{item.label}</div>
                         </div>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <div className="p-10 rounded-4xl bg-linear-to-br from-indigo-900/10 to-black border border-indigo-500/20 shadow-2xl space-y-8 flex flex-col justify-center">
                 <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Neural Sync Active</h3>
                    <p className="text-gray-400 italic text-xs leading-relaxed">
                        institutional memory is automatically updated via institutional pattern recognition across the entire artifact ecosystem.
                    </p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-slow-ping border border-indigo-400" />
                    <span className="text-[10px] font-black uppercase text-indigo-300 italic tracking-[0.2em]">Institutional Core v9.1</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Neural Archive Active
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <Fingerprint className="h-3 w-3 text-gray-800" />
               Institutional Identity Locked
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  );
}
