import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Activity,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Search,
  Binary,
  Cpu,
  Fingerprint,
  Flame,
  Layout,
  ShieldCheck
} from 'lucide-react';
import { getTechDebtHeatmap } from '@/lib/advanced-features-db';
import type { TechDebtHeatmap, TechDebtMetrics } from '@/lib/types/advanced-features';

const RiskConfig = {
  critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', bar: 'bg-rose-500', label: 'Critical' },
  high: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', bar: 'bg-amber-500', label: 'High' },
  medium: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', bar: 'bg-indigo-500', label: 'Moderate' },
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500', label: 'Low' }
};

export default function TechDebtHeatmap() {
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState<TechDebtHeatmap | null>(null);
  const [selectedFile, setSelectedFile] = useState<TechDebtMetrics | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const loadHeatmap = useCallback(async () => {
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      const heatmapData = await getTechDebtHeatmap(repoId);
      setHeatmap(heatmapData);
      if (heatmapData.files.length > 0) setSelectedFile(heatmapData.files[0]);
    } catch (error) {
      console.error('Error loading heatmap:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  const filteredFiles = heatmap?.files.filter(file => 
    filterRisk === 'all' || file.riskLevel === filterRisk
  ).sort((a, b) => b.riskScore - a.riskScore) || [];

  const getRiskDistribution = () => {
    if (!heatmap) return { critical: 0, high: 0, medium: 0, low: 0 };
    return heatmap.files.reduce((acc, file) => {
      acc[file.riskLevel]++;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>);
  };

  const distribution = getRiskDistribution();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Activity className="h-10 w-10 animate-pulse text-rose-500" />
        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] italic">Auditing Architectural Fragility...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-rose-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900 px-2">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-2 font-mono text-[10px] text-rose-300 uppercase tracking-[0.3em] italic">
                 /archive/debt-radiation
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Risk <span className="not-italic text-gray-500">Heatmap</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Differential analysis of structural vulnerabilities and architectural entropy.
              </p>
           </div>
           
           <Button
             className="h-14 px-8 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3 shadow-2xl italic active:scale-95"
             onClick={loadHeatmap}
           >
             <RefreshCw className="h-4 w-4" />
             Execute Audit
           </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
           {[
             { label: "Fragility Index", val: heatmap?.overallRisk, icon: AlertTriangle, color: "text-amber-500", sub: "Systemic Risk Tier" },
             { label: "Thermal Nodes", val: distribution.critical, icon: Flame, color: "text-rose-500", sub: "Critical Vulns" },
             { label: "Source Inventory", val: heatmap?.files.length, icon: Binary, color: "text-indigo-400", sub: "Audited Files" },
             { label: "Integrity Score", val: `${heatmap ? Math.round(100 - heatmap.overallRisk) : 0}%`, icon: ShieldCheck, color: "text-emerald-400", sub: "Structural Soundness" }
           ].map((stat, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
               <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-rose-500/30 transition-all shadow-2xl">
                 <CardContent className="p-8">
                   <div className="flex items-start justify-between mb-8">
                      <div className="h-12 w-12 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                         <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">{stat.label}</span>
                   </div>
                   <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums mb-2 uppercase">
                     {stat.val || 0}
                   </div>
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 mt-4 italic">{stat.sub}</div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        <div className="space-y-6 px-2">
           <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Radiation mapping filters</div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
               <button
                 key={level}
                 onClick={() => setFilterRisk(filterRisk === level ? 'all' : level)}
                 className={`p-8 rounded-4xl border transition-all duration-500 flex flex-col items-center gap-4 group ${
                   filterRisk === level || filterRisk === 'all'
                     ? `${RiskConfig[level].bg} ${RiskConfig[level].border} ${RiskConfig[level].text} scale-100 opacity-100 shadow-[0_20px_50px_-10px_rgba(255,255,255,0.05)]`
                     : 'border-gray-900 bg-gray-900/40 text-gray-700 scale-95 opacity-50 hover:opacity-100'
                 }`}
               >
                 <div className="text-4xl font-black italic tracking-tighter tabular-nums group-hover:scale-110 transition-transform">
                   {distribution[level]}
                 </div>
                 <div className="text-[10px] uppercase font-black tracking-widest italic">{level} Nodes</div>
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start px-2">
          <div className="lg:col-span-12 xl:col-span-7 space-y-4">
             <div className="flex items-center justify-between px-2 mb-4">
                <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Heat Profile Analysis</div>
                <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest px-4 py-1.5 bg-rose-500/05 rounded-full border border-rose-500/10 italic tabular-nums">Active: {filteredFiles.length} Nodes</div>
             </div>
             
             <div className="space-y-3 max-h-[850px] overflow-y-auto pr-4 custom-scrollbar">
              {filteredFiles.map((file, idx) => (
                <motion.div
                  key={file.file}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card
                    className={`group cursor-pointer transition-all duration-300 bg-gray-900/40 border-2 rounded-4xl overflow-hidden ${
                      selectedFile?.file === file.file
                        ? 'border-rose-500/50 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.15)] bg-rose-500/05'
                        : 'border-gray-900 hover:border-gray-800'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <CardContent className="p-8">
                       <div className="flex items-start justify-between gap-10">
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-xl font-black text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight truncate italic">
                                  {file.file.split('/').pop()}
                                </h3>
                                <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border italic ${RiskConfig[file.riskLevel].bg} ${RiskConfig[file.riskLevel].text} ${RiskConfig[file.riskLevel].border}`}>
                                   {file.riskLevel}
                                </div>
                             </div>
                             <div className="text-[10px] text-gray-700 font-mono italic truncate mb-8 opacity-60 tracking-tight">{file.file}</div>
                             
                             <div className="grid grid-cols-3 gap-12 border-t border-gray-800/50 pt-6">
                                <div className="space-y-1">
                                   <div className="text-[9px] uppercase font-black text-gray-700 tracking-tighter italic">Complexity</div>
                                   <div className="text-sm font-black text-gray-400 italic font-mono tabular-nums">{file.complexity}</div>
                                </div>
                                <div className="space-y-1">
                                   <div className="text-[9px] uppercase font-black text-gray-700 tracking-tighter italic">Flux Index</div>
                                   <div className="text-sm font-black text-rose-400 italic font-mono tabular-nums">{file.changeFrequency}</div>
                                </div>
                                <div className="space-y-1">
                                   <div className="text-[9px] uppercase font-black text-gray-700 tracking-tighter italic">Provenance</div>
                                   <div className="text-sm font-black text-gray-400 italic font-mono tabular-nums">{file.contributors.length} Users</div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800 shadow-inner group-hover:border-rose-500/20 transition-all">
                             <div className="text-2xl font-black text-rose-400 italic tracking-tighter tabular-nums">{file.riskScore}</div>
                             <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest italic">Score</div>
                             <div className="h-16 w-1 bg-gray-900 rounded-full overflow-hidden mt-2 border border-gray-800">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${file.riskScore}%` }}
                                  transition={{ duration: 1, ease: "circOut" }}
                                  className={`w-full transition-all duration-700 shadow-[0_0_10px_rgba(244,63,94,0.5)] ${RiskConfig[file.riskLevel].bar}`} 
                                />
                             </div>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-5 xl:sticky xl:top-8">
             <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key={selectedFile.file}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                   <Card className="bg-gray-900/60 border border-rose-500/20 rounded-5xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative">
                      <div className="h-1.5 bg-linear-to-r from-rose-500 via-amber-500 to-indigo-500" />
                      <CardContent className="p-10 space-y-12">
                         <header>
                            <div className="flex items-center justify-between mb-6">
                               <div className="px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] uppercase font-black text-rose-400 tracking-[0.2em] italic">Node Inspection Active</div>
                               <Cpu className="h-6 w-6 text-rose-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter break-all italic leading-none">{selectedFile.file.split('/').pop()}</h2>
                            <div className="p-4 rounded-xl bg-black border border-gray-800 group/code relative overflow-hidden">
                               <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/40" />
                               <p className="text-[10px] font-mono text-gray-700 break-all leading-relaxed whitespace-pre-wrap">{selectedFile.file}</p>
                            </div>
                         </header>

                         <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                               <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest italic">Exposure Factor</div>
                               <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{selectedFile.riskScore}</div>
                               <div className="text-[9px] font-black text-rose-500 uppercase italic">Unit Radiation</div>
                            </div>
                            <div className="p-6 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                               <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest italic">Artifact scale</div>
                               <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{selectedFile.linesOfCode.toLocaleString()}</div>
                               <div className="text-[9px] font-black text-gray-600 uppercase italic">Line Density</div>
                            </div>
                         </div>

                         <div className="space-y-8">
                            {[
                               { label: "Coverage Delta", val: selectedFile.testCoverage, color: "bg-rose-500", text: "text-rose-400" },
                               { label: "Knowledge Density", val: selectedFile.knowledgeOwnership, color: "bg-indigo-500", text: "text-indigo-400" }
                            ].map((bar, i) => (
                               <div key={i} className="space-y-3">
                                  <div className="flex items-center justify-between px-1">
                                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">{bar.label}</span>
                                     <span className={`text-[10px] font-black ${bar.text} tabular-nums tracking-widest italic`}>{bar.val}% SYNCHRONIZED</span>
                                  </div>
                                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${bar.val}%` }}
                                       transition={{ duration: 1.5, ease: "circOut" }}
                                       className={`h-full ${bar.color} shadow-[0_0_15px_rgba(255,255,255,0.2)]`} 
                                     />
                                  </div>
                               </div>
                            ))}
                         </div>

                         <div className="space-y-4">
                            <div className="text-[10px] uppercase font-black text-gray-800 tracking-[0.4em] px-1 italic">Genetic Origins</div>
                            <div className="flex flex-wrap gap-2">
                               {selectedFile.contributors.map((contributor, i) => (
                                 <div key={i} className="px-4 py-2 bg-black/40 rounded-xl border border-gray-800 text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-3 group/chip hover:border-gray-700 transition-colors italic">
                                    <Fingerprint className="h-3 w-3 text-gray-800" />
                                    {contributor}
                                 </div>
                               ))}
                            </div>
                         </div>

                         <Button className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-4 group italic active:scale-95">
                            <Search className="h-4 w-4" />
                            Deconstruct Blueprint
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                         </Button>
                      </CardContent>
                   </Card>
                </motion.div>
              ) : (
                <div className="h-[700px] flex flex-col items-center justify-center bg-gray-900/10 border-2 border-dashed border-gray-800 rounded-5xl opacity-40 space-y-8">
                   <div className="h-20 w-20 rounded-3xl bg-black border border-gray-800 flex items-center justify-center shadow-inner">
                      <Layout className="h-8 w-8 text-gray-800" />
                   </div>
                   <p className="text-gray-700 font-black uppercase tracking-[0.4em] text-[10px] italic">Select thermal node</p>
                </div>
              )}
             </AnimatePresence>
          </div>
        </div>

        {heatmap && heatmap.recommendations.length > 0 && (
          <div className="mx-2 p-12 md:p-16 rounded-5xl bg-rose-500/05 border border-rose-500/10 flex flex-col xl:flex-row items-center gap-16 shadow-[0_40px_100_rgba(244,63,94,0.1)] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-160 h-160 bg-rose-500/05 rounded-full blur-[120px] pointer-events-none" />
             <div className="flex-1 space-y-6 text-center xl:text-left">
                <div className="flex items-center justify-center xl:justify-start gap-4 text-rose-500">
                   <Sparkles className="h-8 w-8 shadow-2xl" />
                   <h3 className="text-4xl font-black uppercase tracking-tighter italic">Intervention Strategy</h3>
                </div>
                <p className="text-gray-500 leading-relaxed font-medium italic text-lg max-w-2xl">
                   Integrated telemetry has synthesized tactical protocols to stabilize architectural health and prevent systemic technical bankruptcy.
                </p>
             </div>
             <div className="grid grid-cols-1 gap-4 w-full xl:w-min xl:min-w-[400px]">
                {heatmap.recommendations.slice(0, 3).map((rec, i) => (
                   <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-6 p-6 bg-black border border-gray-800 rounded-3xl group hover:border-rose-500/20 transition-all shadow-xl"
                   >
                      <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                         <ChevronRight className="h-5 w-5 text-rose-400" />
                      </div>
                      <span className="text-sm font-black text-gray-500 uppercase tracking-tight leading-relaxed text-left group-hover:text-gray-200 transition-colors italic">{rec}</span>
                   </motion.div>
                 ))}
              </div>
           </div>
        )}

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
              Radiation Telemetry Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Vectors v3.4.1
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
