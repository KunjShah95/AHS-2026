import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  Database,
  Zap,
  Code2,
  Clock,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  Terminal,
  UnfoldVertical,
  FoldVertical,
  Binary
} from 'lucide-react';
import { getCodeFlows, getCriticalFlows } from '@/lib/advanced-features-db';
import type { CodeFlow } from '@/lib/types/advanced-features';

const FlowTypeIcons = {
  api: Layers,
  controller: GitBranch,
  service: Zap,
  database: Database,
  external: AlertTriangle,
  util: Code2
};

const FlowTypeColors = {
  api: 'text-indigo-400',
  controller: 'text-purple-400',
  service: 'text-amber-400',
  database: 'text-emerald-400',
  external: 'text-rose-400',
  util: 'text-gray-400'
};

export default function FlowTracer() {
  const [loading, setLoading] = useState(true);
  const [flows, setFlows] = useState<CodeFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<CodeFlow | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [animatingFlow, setAnimatingFlow] = useState(false);

  const loadFlows = useCallback(async () => {
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      
      const flowsData = showCriticalOnly 
        ? await getCriticalFlows(repoId)
        : await getCodeFlows(repoId);
      
      setFlows(flowsData);
      
      if (flowsData.length > 0 && !selectedFlow) {
        setSelectedFlow(flowsData[0]);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  }, [showCriticalOnly, selectedFlow]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const animateFlow = async () => {
    setAnimatingFlow(true);
    setExpandedSteps(new Set());
    
    if (selectedFlow) {
      for (let i = 0; i < selectedFlow.flowSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        setExpandedSteps(prev => new Set([...prev, selectedFlow.flowSteps[i].id]));
      }
    }
    
    setAnimatingFlow(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <GitBranch className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Tracing Request Propagation...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/propagation-vectors
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Flow <span className="not-italic text-gray-500">Tracer</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Experience systemic traversal across architectural tiers and distributed layers.
              </p>
           </div>
           
           <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              className={`h-14 px-8 border-[1.5px] rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl flex items-center gap-3 ${
                showCriticalOnly ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-transparent border-gray-800 text-gray-500'
              }`}
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
            >
              <AlertTriangle className="h-4 w-4" />
              {showCriticalOnly ? 'Critical Path' : 'All Requests'}
            </Button>
            
            {selectedFlow && (
              <Button
                className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3 shadow-2xl disabled:opacity-50"
                onClick={animateFlow}
                disabled={animatingFlow}
              >
                <Play className={`h-4 w-4 ${animatingFlow ? 'animate-ping' : ''}`} />
                {animatingFlow ? 'Tracer Active' : 'Traverse Vector'}
              </Button>
            )}
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-12 lg:col-span-4 space-y-6">
            <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-2 italic">Identified Entry points</div>
            <div className="space-y-4 max-h-160 overflow-y-auto pr-4 custom-scrollbar">
              {flows.length === 0 ? (
                <div className="p-20 text-center bg-gray-900/20 border-2 border-dashed border-gray-900 rounded-4xl space-y-4">
                   <Zap className="h-12 w-12 text-gray-800 mx-auto" />
                   <p className="text-gray-700 font-black uppercase tracking-[0.2em] text-xs">No vectors matched</p>
                </div>
              ) : (
                flows.map((flow, idx) => (
                  <motion.div
                    key={flow.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`group cursor-pointer bg-gray-900/40 border-[1.5px] rounded-4xl overflow-hidden transition-all duration-300 ${
                        selectedFlow?.id === flow.id
                          ? 'border-indigo-500/60 bg-indigo-500/05 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]'
                          : 'border-gray-900 hover:border-gray-800'
                      }`}
                      onClick={() => setSelectedFlow(flow)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                             {flow.isCriticalPath && (
                               <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] shrink-0" />
                             )}
                             <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors truncate uppercase italic">
                               {flow.entryPoint.split('/').pop()}
                             </h3>
                          </div>
                          <div className="text-[9px] font-black uppercase text-gray-700 tracking-widest bg-black px-2 py-0.5 rounded-full border border-gray-800 shrink-0 tabular-nums">{flow.flowSteps.length} Segments</div>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-2">
                           <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest italic">{flow.entryType}</span>
                           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/05 rounded-lg border border-indigo-500/10">
                              <Zap className="h-3 w-3 text-indigo-400" />
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest tabular-nums italic">Impact: {flow.estimatedImpact}</span>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-8">
            <Card className="bg-gray-900/60 border border-gray-800 rounded-4xl overflow-hidden min-h-160 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
              {selectedFlow ? (
                <>
                  <header className="p-10 border-b border-gray-800 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.4em] mb-2 flex items-center gap-3 italic">
                           <Sparkles className="h-4 w-4" />
                           Operational sequence analysis
                        </div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase break-all">{selectedFlow.entryPoint}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-right shrink-0">
                       <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic">Structural Entropy</span>
                       <div className="flex gap-1.5 p-2 bg-black rounded-lg border border-gray-800 shadow-inner">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className={`h-1.5 w-3.5 rounded-sm transition-all duration-500 ${i < selectedFlow.complexity ? (selectedFlow.complexity > 7 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]') : 'bg-gray-900'}`} />
                          ))}
                       </div>
                    </div>
                  </header>
                  
                  <CardContent className="p-12 space-y-16">
                    <div className="relative space-y-16">
                      <AnimatePresence>
                        {selectedFlow.flowSteps.map((step, idx) => {
                          const Icon = FlowTypeIcons[step.type as keyof typeof FlowTypeIcons] || Code2;
                          const isExpanded = expandedSteps.has(step.id);
                          const isLast = idx === selectedFlow.flowSteps.length - 1;

                          return (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                              className="relative"
                            >
                              {!isLast && (
                                <div className="absolute left-6 top-12 bottom-[-64px] w-0.5 bg-linear-to-b from-indigo-500/40 via-indigo-500/10 to-transparent z-0" />
                              )}

                              <div className="relative z-10 flex items-start gap-10 border-indigo-500/10 hover:border-indigo-500/20 transition-colors">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-700 bg-black border border-gray-800 shadow-inner ${isExpanded ? 'border-indigo-500/40 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'group-hover:border-gray-700'}`}>
                                   <Icon className={`h-5 w-5 transition-colors duration-500 ${isExpanded ? FlowTypeColors[step.type as keyof typeof FlowTypeColors] : 'text-gray-700'}`} />
                                </div>
                                
                                <Card
                                  className={`flex-1 group cursor-pointer border-[1.5px] transition-all duration-500 rounded-4xl overflow-hidden ${
                                    isExpanded ? 'bg-black border-indigo-500/30' : 'bg-black/20 border-gray-900 hover:border-gray-800 hover:bg-black/40'
                                  }`}
                                  onClick={() => toggleStep(step.id)}
                                >
                                  <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                       <div className="space-y-1">
                                          <div className="flex items-center gap-4">
                                             <h4 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic">{step.function}</h4>
                                             <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest bg-black border border-gray-800 italic ${FlowTypeColors[step.type as keyof typeof FlowTypeColors] || 'text-gray-500'}`}>
                                                {step.type}
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-3 opacity-60">
                                             <Terminal className="h-3 w-3 text-gray-600" />
                                             <p className="text-[10px] font-mono text-gray-500 tracking-tighter">
                                               {step.file.split('/').slice(-2).join('/')}:{step.lineNumber}
                                             </p>
                                          </div>
                                       </div>
                                       <div className="h-10 w-10 rounded-xl bg-gray-950 border border-gray-900 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                                          {isExpanded ? <FoldVertical className="h-4 w-4 text-gray-600" /> : <UnfoldVertical className="h-4 w-4 text-gray-600" />}
                                       </div>
                                    </div>
                                    
                                    <p className={`text-sm font-medium italic leading-relaxed transition-colors duration-500 ${isExpanded ? 'text-gray-300' : 'text-gray-500'}`}>
                                      {step.description}
                                    </p>

                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          className="space-y-8 overflow-hidden pt-8 mt-8 border-t border-gray-800/50"
                                        >
                                          <div className="relative p-6 bg-gray-950 rounded-3xl border border-gray-800 font-mono text-xs leading-relaxed text-indigo-300 shadow-inner group/code">
                                             <div className="absolute right-4 top-4 text-[9px] font-black uppercase text-gray-800 tracking-widest select-none italic">Source Artifact</div>
                                            <pre className="overflow-x-auto custom-scrollbar">
                                              <code>{step.code}</code>
                                            </pre>
                                          </div>
                                          
                                          <div className="flex flex-wrap gap-10 items-center border-t border-gray-900 pt-6">
                                            {step.nextSteps.length > 0 && (
                                              <div className="space-y-3">
                                                <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic">Downstream vectors</div>
                                                <div className="flex flex-wrap gap-2">
                                                  {step.nextSteps.map(next => (
                                                    <div key={next} className="px-3 py-1 bg-black rounded-lg border border-gray-800 text-[9px] font-black text-indigo-400 uppercase tracking-widest shadow-lg italic">
                                                       {next}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                            
                                            {step.duration && (
                                              <div className="space-y-3">
                                                <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] italic">Latency delta</div>
                                                <div className="flex items-center gap-3 px-4 py-1.5 bg-black rounded-lg border border-gray-800 text-white font-black text-xs italic tracking-tighter tabular-nums">
                                                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                                  {step.duration}ms
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </CardContent>
                                </Card>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-160 space-y-8 opacity-40">
                   <div className="h-20 w-20 rounded-3xl bg-black border border-gray-800 flex items-center justify-center">
                      <GitBranch className="h-10 w-10 text-gray-800" />
                   </div>
                   <p className="text-gray-700 font-black uppercase tracking-[0.4em] text-xs px-2 text-center italic">Awaiting propagation vector selection</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="p-12 md:p-16 rounded-4xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <Layers className="h-10 w-10 text-indigo-400" />
           </div>
           <div className="flex-1 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Vector Diagnostics</h4>
              <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                 Integration graph spans <span className="text-white font-bold">Multiple Architectural Tiers</span>. Identified critical path localized. High probability of performance gains in <span className="text-indigo-400 font-bold italic">service-to-database</span> transition.
              </p>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Propagation Telemetry Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Archive v4.0.1
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
