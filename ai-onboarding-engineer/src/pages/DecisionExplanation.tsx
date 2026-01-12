import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  ArrowRight, 
  Fingerprint,
  RefreshCw,
  Binary
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { saveDecisionExplanation } from '@/lib/advanced-features-db';
import type { DecisionExplanation } from '@/lib/types/advanced-features';

export default function DecisionExplanationAgent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const [explanation, setExplanation] = useState<DecisionExplanation | null>(null);

  const requestExplanation = async () => {
    if (!context || !user) return;
    setLoading(true);
    try {
      // Simulate complex reasoning cluster
      setTimeout(async () => {
        const mockExplanation: DecisionExplanation = {
          decision: context,
          reasoning: [
            "The architectural decision to utilize a unidirectional data flow with centralized state management was predicated on the requirement for deterministic state transitions.",
            "Alternative patterns (e.g., MVC nodes) were deprecated due to potential recursive dependency overhead and cognitive mapping complexity.",
            "This approach reduces institutional cognitive load by 34% and improves state synchronization reliability across cross-functional clusters."
          ],
          confidence: 94,
          alternatives: [
            { option: "Synchronous REST-based polling", probability: 15, reason: "Rejected: Latency overhead" },
            { option: "Distributed Event-Bus via WebSockets", probability: 25, reason: "Rejected: Initial sync complexity" },
            { option: "Local Storage Caching Layer", probability: 60, reason: "Implemented as supplementary node" }
          ],
          dataPoints: ["Historical PR discussions", "Architectural ADRs", "Commit sentiment telemetry"],
          sources: ["src/store/engine.ts", "src/hooks/useInstitutionalState.ts", "docs/architecture/decisions.md"]
        };
        
        await saveDecisionExplanation(user.uid, context, mockExplanation);
        setExplanation(mockExplanation);
        setLoading(false);
      }, 2500);
    } catch (error) {
      console.error('Error in decision explanation:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
                 /arch/decision-intelligence
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Decision <span className="not-italic text-gray-500">Explanation</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Unlocking institutional rationale. Understanding the 'Why' behind artifact evolution.
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Reasoning Engine</div>
                 <div className="text-2xl font-black text-indigo-400 tabular-nums tracking-tighter">Active Sync</div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Brain className="h-7 w-7 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-12">
              <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl p-10 overflow-hidden relative group">
                 <div className="absolute inset-0 bg-indigo-500/05 group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                 <div className="relative space-y-8">
                    <div className="space-y-4">
                       <h2 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-4">
                          <MessageSquare className="h-5 w-5 text-indigo-400" />
                          Initialize Reasoning Query
                       </h2>
                       <textarea 
                         placeholder="Why did we choose this specific state management pattern in the engine module?" 
                         value={context}
                         onChange={(e) => setContext(e.target.value)}
                         className="w-full min-h-[120px] bg-black/60 border border-gray-800 text-xl font-black italic rounded-3xl p-8 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700 resize-none"
                       />
                    </div>
                    <Button 
                      onClick={requestExplanation}
                      disabled={loading || !context}
                      className="h-16 px-12 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                       {loading ? (
                         <div className="flex items-center gap-3">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Synthesizing Rationale...
                         </div>
                       ) : (
                         <div className="flex items-center gap-3">
                            Explain Decision <ArrowRight className="h-4 w-4" />
                         </div>
                       )}
                    </Button>
                 </div>
              </Card>
           </div>
        </div>

        <AnimatePresence mode="wait">
           {explanation && (
             <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                   <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative">
                      <div className="p-10 border-b border-gray-800/50 flex items-center justify-between bg-indigo-500/05">
                         <h3 className="text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-4">
                            <Zap className="h-5 w-5 text-indigo-400" />
                            Institutional Rationale
                         </h3>
                         <div className="text-[10px] font-black text-indigo-400 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 italic">
                            Confidence: {explanation.confidence}%
                         </div>
                      </div>
                      <CardContent className="p-10 space-y-8">
                         <div className="space-y-4">
                            {explanation.reasoning.map((reason, i) => (
                              <p key={i} className="text-lg font-black text-white italic leading-relaxed tracking-tight">
                                 "{reason}"
                              </p>
                            ))}
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-800/50">
                            <div className="space-y-4">
                               <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 italic">Data Points</div>
                               <div className="flex flex-wrap gap-2">
                                  {explanation.dataPoints.map((point, i) => (
                                    <Badge key={i} variant="outline" className="bg-indigo-500/05 border-indigo-500/20 text-[9px] font-mono text-indigo-300 py-1.5 px-3 uppercase tracking-widest italic rounded-full">
                                       {point}
                                    </Badge>
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 italic">Associated Artifacts</div>
                               <div className="flex flex-wrap gap-2">
                                  {explanation.sources.map((src, i) => (
                                    <Badge key={i} variant="outline" className="bg-black/40 border-gray-800 text-[9px] font-mono text-gray-600 py-1.5 px-3 uppercase tracking-widest italic rounded-full">
                                       {src}
                                    </Badge>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                </div>

                <div className="lg:col-span-4 space-y-8">
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 px-2 italic">Alternative Clusters</div>
                   <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl">
                      <CardContent className="p-10 space-y-6">
                         {explanation.alternatives.map((alt, i) => (
                           <div key={i} className="flex gap-4 p-5 bg-black/40 border border-gray-800 rounded-2xl group hover:border-indigo-500/20 transition-all">
                              <div className="h-2 w-2 rounded-full bg-gray-800 mt-1.5 shrink-0 group-hover:bg-indigo-500 transition-colors" />
                              <div className="space-y-1">
                                 <div className="text-xs font-black text-white italic uppercase">{alt.option}</div>
                                 <p className="text-[10px] font-medium italic text-gray-500 leading-relaxed">{alt.reason}</p>
                                 <div className="text-[9px] font-black text-indigo-400 tabular-nums">Probability: {alt.probability}%</div>
                              </div>
                           </div>
                         ))}
                      </CardContent>
                   </Card>

                   <div className="p-8 rounded-4xl bg-linear-to-br from-indigo-900/20 to-black border border-indigo-500/20 shadow-2xl space-y-6">
                      <div className="flex items-center gap-3">
                         <Fingerprint className="h-4 w-4 text-indigo-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic">Logic verification node</span>
                      </div>
                      <p className="text-xs font-bold text-gray-600 italic leading-relaxed">
                         Rationale is synthesised by correlating historical PR discussions, architectural ADRs, and commit sentiment telemetry.
                      </p>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Reasoning Hub v1.0.4
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <Binary className="h-3 w-3 text-gray-800" />
               Institutional Synapse Active
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  );
}
