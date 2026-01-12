import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Target,
  AlertCircle,
  TrendingUp,
  FileCode,
  Zap,
  Tag,
  ChevronRight,
  ShieldAlert,
  Binary,
  Compass,
  ArrowRight
} from 'lucide-react';
import { getCriticalPaths, getMustUnderstandFirst } from '@/lib/advanced-features-db';
import type { CriticalPath } from '@/lib/types/advanced-features';

const PriorityConfig = {
  critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Mission Critical' },
  high: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'High Priority' },
  medium: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', label: 'Medium' },
  low: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'Low' }
};

export default function CriticalPaths() {
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<CriticalPath[]>([]);
  const [mustUnderstand, setMustUnderstand] = useState<CriticalPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<CriticalPath | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const loadPaths = useCallback(async () => {
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      
      const [allPaths, mustFirst] = await Promise.all([
        getCriticalPaths(repoId),
        getMustUnderstandFirst(repoId)
      ]);

      setPaths(allPaths);
      setMustUnderstand(mustFirst);
      if (mustFirst.length > 0) setSelectedPath(mustFirst[0]);
    } catch (error) {
      console.error('Error loading paths:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const filteredPaths = paths.filter(p => 
    filter === 'all' || p.priority === filter
  ).sort((a, b) => b.businessValue - a.businessValue);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Compass className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Mapping Critical Infrastructure...</span>
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
                 /archive/core-vectors
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Critical <span className="not-italic text-gray-500">Paths</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                High-impact architectural sequences identified via systemic influence analysis.
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Identified Paths</div>
                 <div className="text-2xl font-black text-white italic tracking-tighter tabular-nums">{paths.length} Nodes</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Binary className="h-6 w-6 text-indigo-400" />
              </div>
           </div>
        </header>

        {mustUnderstand.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic flex items-center gap-4">
                 <ShieldAlert className="h-6 w-6 text-indigo-400" />
                 Prerequisite Genesis
               </h2>
               <div className="h-px flex-1 mx-8 bg-gray-900" />
               <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Must Understand</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mustUnderstand.map((path, idx) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    className={`group cursor-pointer bg-gray-900/40 border-[1.5px] rounded-4xl overflow-hidden transition-all duration-300 ${
                      selectedPath?.id === path.id ? 'border-indigo-500/60 bg-indigo-500/05 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.2)]' : 'border-gray-800 hover:border-indigo-500/30'
                    }`}
                    onClick={() => setSelectedPath(path)}
                  >
                    <CardContent className="p-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Zap className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-white italic tracking-tighter leading-none mb-1 tabular-nums">{path.businessValue}</div>
                          <div className="text-[9px] uppercase font-black text-gray-700 tracking-[0.2em] italic">Impact Density</div>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight mb-4 italic">{path.name}</h3>
                      <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed line-clamp-2">
                        {path.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-12 xl:col-span-7 space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border italic ${
                    filter === p
                      ? 'bg-white border-white text-black shadow-[0_10px_30px_-5px_rgba(255,255,255,0.3)]'
                      : 'bg-gray-900/40 border-gray-800 text-gray-600 hover:border-gray-700 hover:text-gray-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-4 max-h-160 overflow-y-auto pr-4 custom-scrollbar">
              {filteredPaths.length === 0 ? (
                <div className="p-20 text-center bg-gray-900/20 border-2 border-dashed border-gray-900 rounded-5xl space-y-4">
                   <AlertCircle className="h-12 w-12 text-gray-800 mx-auto" />
                   <p className="text-gray-700 font-black uppercase tracking-[0.2em] text-[10px] italic">No Tier Matches</p>
                </div>
              ) : (
                filteredPaths.map((path, idx) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`group cursor-pointer bg-gray-900/40 border-[1.5px] rounded-4xl overflow-hidden transition-all duration-300 ${
                        selectedPath?.id === path.id
                          ? 'border-indigo-500/50 bg-indigo-500/05 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.15)]'
                          : 'border-gray-900 hover:border-gray-800'
                      }`}
                      onClick={() => setSelectedPath(path)}
                    >
                      <CardContent className="p-8 flex items-center justify-between gap-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">{path.name}</h3>
                            <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border italic ${PriorityConfig[path.priority].bg} ${PriorityConfig[path.priority].text} ${PriorityConfig[path.priority].border}`}>
                              {PriorityConfig[path.priority].label}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium italic line-clamp-1">{path.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-10 shrink-0 border-l border-gray-800/50 pl-10">
                          <div className="text-center">
                            <div className="text-xl font-black text-white italic tracking-tighter tabular-nums">{path.files.length}</div>
                            <div className="text-[9px] text-gray-700 uppercase font-black tracking-widest mt-1 italic">Files</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-black text-indigo-400 italic tracking-tighter tabular-nums">{path.changeFrequency}</div>
                            <div className="text-[9px] text-gray-700 uppercase font-black tracking-widest mt-1 italic">Flux</div>
                          </div>
                          <ChevronRight className={`h-5 w-5 text-gray-700 transition-transform ${selectedPath?.id === path.id ? 'translate-x-1 text-indigo-400' : ''}`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 xl:sticky xl:top-8">
            <AnimatePresence mode="wait">
              {selectedPath ? (
                <motion.div
                  key={selectedPath.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-gray-900/60 border border-indigo-500/20 rounded-4xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative">
                    <div className="h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                    <CardContent className="p-10 space-y-12">
                      <header>
                        <div className="flex items-center justify-between mb-6">
                           <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] uppercase font-bold text-indigo-400 tracking-widest italic">Target Path deconstruction</div>
                           <Target className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter break-all italic leading-none">{selectedPath.name}</h3>
                        <div className="p-6 rounded-2xl bg-black border border-gray-800 relative overflow-hidden group/desc">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/40" />
                           <p className="text-[11px] text-gray-400 font-medium italic leading-relaxed">
                             {selectedPath.description}
                           </p>
                        </div>
                      </header>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-8 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                           <div className="text-[9px] uppercase font-black text-gray-600 tracking-widest italic">Impact Factor</div>
                           <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{selectedPath.businessValue}</div>
                           <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Business Value</div>
                        </div>
                        <div className="p-8 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                           <div className="text-[9px] uppercase font-black text-gray-600 tracking-widest italic">Node Stability</div>
                           <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{100 - selectedPath.changeFrequency}</div>
                           <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">% Static</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                         <div className="text-[10px] uppercase font-black text-gray-700 tracking-[0.3em] px-1 italic">Encapsulated Artifacts</div>
                         <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                           {selectedPath.files.map((file, idx) => (
                             <div key={idx} className="group/file flex items-center justify-between p-4 rounded-xl bg-black/40 border border-gray-800 hover:border-indigo-500/20 transition-all cursor-default">
                                <div className="flex items-center gap-4">
                                   <div className="h-8 w-8 rounded-lg bg-indigo-500/05 border border-indigo-500/10 flex items-center justify-center">
                                      <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
                                   </div>
                                   <span className="text-[11px] font-mono text-gray-500 group-hover:text-indigo-400 transition-colors truncate">{file}</span>
                                </div>
                                <ArrowRight className="h-3 w-3 text-gray-800 group-hover/file:translate-x-1 transition-transform" />
                             </div>
                           ))}
                         </div>
                      </div>

                      {selectedPath.tags && selectedPath.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-8 border-t border-gray-800/50">
                          {selectedPath.tags.map((tag, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-500/05 rounded-lg border border-indigo-500/10 text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">
                               <Tag className="h-3 w-3 opacity-50" />
                               {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-160 flex flex-col items-center justify-center bg-gray-900/10 border-2 border-dashed border-gray-900 rounded-5xl opacity-40 space-y-8">
                   <div className="h-20 w-20 rounded-3xl bg-black border border-gray-800 flex items-center justify-center">
                      <Compass className="h-8 w-8 text-gray-700" />
                   </div>
                   <p className="text-gray-600 font-black uppercase tracking-[0.4em] text-[10px] italic">Awaiting Target Selection</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-12 md:p-16 rounded-5xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="h-10 w-10 text-indigo-400" />
           </div>
           <div className="flex-1 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Optimization Advisory</h4>
              <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                Synthesis of these critical pathways reduces architectural context-switching debt by <span className="text-white font-bold tabular-nums italic">22 hours</span> per cycle. Foundation nodes recognized.
              </p>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-10">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Path Mapping Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Discovery v3.0.2
              </div>
              <div>Institutional Resolution: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
