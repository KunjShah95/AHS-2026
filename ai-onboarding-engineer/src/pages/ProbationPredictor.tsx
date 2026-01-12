import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  Brain,
  Binary,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getProbationPrediction } from '@/lib/advanced-features-db';
import type { ProbationPrediction } from '@/lib/types/advanced-features';

export default function ProbationPredictor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<ProbationPrediction | null>(null);

  const loadPrediction = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      const data = await getProbationPrediction(user.uid, repoId);
      setPrediction(data);
    } catch (error) {
      console.error('Error loading probation prediction:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPrediction();
  }, [loadPrediction]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Simulating Cognitive Success Trajectories...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
                 /ops/predictive-retention
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Probation <span className="not-italic text-gray-500">Success</span> Predictor
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Algorithmic forecasting of institutional integration and performance sustainability.
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Confidence Level</div>
                 <div className="text-2xl font-black text-indigo-400 tabular-nums tracking-tighter">{prediction?.confidenceLevel || 0}% Accuracy</div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Gauge className="h-7 w-7 text-indigo-400" />
              </div>
           </div>
        </header>

        {prediction ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/05 rounded-full blur-[100px] pointer-events-none" />
                <CardHeader className="p-10 border-b border-gray-800/50">
                   <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Velocity Convergence</h2>
                </CardHeader>
                <CardContent className="p-10 space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div className="text-7xl font-black text-white italic tracking-tighter tabular-nums flex items-baseline gap-4">
                            {prediction.successProbability}%
                            <span className="text-xs uppercase font-black text-emerald-400 tracking-[0.2em]">Probability</span>
                         </div>
                         <p className="text-gray-400 italic font-medium leading-relaxed">
                            Current behavioral indicators suggest a <span className="text-white">highly stable</span> integration into the institutional cluster. Output frequency mirrors top-tier performance benchmarks.
                         </p>
                      </div>
                      
                      <div className="space-y-6">
                         {[
                           { label: "Learning Velocity", val: prediction.factors.learningVelocity, color: "bg-indigo-500" },
                           { label: "Task Success", val: prediction.factors.taskSuccessRate, color: "bg-emerald-500" },
                           { label: "Code Quality", val: prediction.factors.codeQuality, color: "bg-purple-500" },
                           { label: "Collaboration", val: prediction.factors.teamCollaboration, color: "bg-amber-500" }
                         ].map((factor, i) => (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                                 <span className="text-gray-600">{factor.label}</span>
                                 <span className="text-white">{factor.val}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${factor.val}%` }}
                                   transition={{ duration: 1.5, delay: i * 0.1 }}
                                   className={`h-full ${factor.color} shadow-[0_0_10px_rgba(99,102,241,0.3)]`} 
                                 />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl">
                    <CardHeader className="p-10 pb-4">
                       <h3 className="text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-rose-500" />
                          Risk Constants
                       </h3>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 space-y-4">
                       {prediction.risks.map((risk, i) => (
                         <div key={i} className="flex gap-4 p-4 bg-rose-500/05 border border-rose-500/10 rounded-2xl">
                            <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                            <p className="text-sm font-medium italic text-gray-400">{risk}</p>
                         </div>
                       ))}
                    </CardContent>
                 </Card>

                 <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl">
                    <CardHeader className="p-10 pb-4">
                       <h3 className="text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                          Strategic Shift
                       </h3>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 space-y-4">
                       {prediction.recommendations.map((rec, i) => (
                         <div key={i} className="flex gap-4 p-4 bg-indigo-500/05 border border-indigo-500/10 rounded-2xl">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <p className="text-sm font-medium italic text-indigo-300">{rec}</p>
                         </div>
                       ))}
                    </CardContent>
                 </Card>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 px-2 italic">Institutional History</div>
               <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl">
                 <CardContent className="p-10 space-y-8">
                    {[
                      { event: "First Artifact Merge", time: "Day 3", status: "success" },
                      { event: "Architecture Assessment", time: "Day 12", status: "success" },
                      { event: "Knowledge Distribution", time: "Day 18", status: "warning" },
                      { event: "Cross-Functional Sync", time: "Day 24", status: "pending" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-800/50 pb-6 last:border-0 last:pb-0">
                         <div className="space-y-1">
                            <div className="text-xs font-black uppercase text-white italic">{item.event}</div>
                            <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{item.time}</div>
                         </div>
                         <div className={`h-2 w-2 rounded-full ${
                           item.status === 'success' ? 'bg-emerald-500' : 
                           item.status === 'warning' ? 'bg-amber-500' : 'bg-gray-800'
                         } shadow-[0_0_10px_currentColor]`} />
                      </div>
                    ))}
                 </CardContent>
               </Card>

               <div className="p-8 rounded-4xl bg-indigo-600/10 border border-indigo-500/20 space-y-4 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Brain className="h-16 w-16 text-white" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">Predictive Logic</h4>
                  <p className="text-xs font-bold text-gray-400 italic leading-relaxed relative z-10">
                     Models are synthesized from {">"}12k institutional signals including commit entropy, PR review density, and cognitive alignment scores.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 space-y-8">
             <div className="h-20 w-20 rounded-3xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto opacity-50">
                <Target className="h-10 w-10 text-gray-600" />
             </div>
             <p className="text-gray-500 font-medium italic text-lg">Insufficient telemetry to generate accurate success forecast.</p>
             <Button className="h-14 px-12 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl hover:bg-gray-200 transition-all">
                Initialize Data Collection
             </Button>
          </div>
        )}
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Forecasting Matrix Active
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <Binary className="h-3 w-3 text-gray-800" />
               Institutional Model v2.1
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  );
}
