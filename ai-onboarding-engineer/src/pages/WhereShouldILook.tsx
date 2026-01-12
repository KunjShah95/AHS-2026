import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Loader2,
  Zap,
  ChevronRight,
  BrainCircuit,
  Maximize2,
  Terminal,
  Cpu,
  Binary,
  Compass,
  Target,
  ArrowRight,
  Fingerprint,
  ShieldCheck
} from 'lucide-react';
import type { WhereLookResult, FileSuggestion } from '@/lib/types/advanced-features';

const ActionConfig = {
  start_here: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Recommended Root', icon: CheckCircle2 },
  review: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', label: 'Supporting Node', icon: TrendingUp },
  avoid: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', label: 'Fragile Section', icon: XCircle }
};

export default function WhereShouldILook() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhereLookResult | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<FileSuggestion | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSelectedSuggestion(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResult: WhereLookResult = {
        query: query,
        repoId: localStorage.getItem('currentRepoId') || 'demo-repo',
        suggestions: [
          {
            file: 'src/api/auth/login.ts',
            relevanceScore: 95,
            riskLevel: 'low',
            reason: 'Primary authentication terminal handling session initialization and credential validation.',
            suggestedAction: 'start_here',
            relatedFiles: ['src/lib/auth.ts', 'src/middleware/auth.ts'],
            estimatedComplexity: 30
          },
          {
            file: 'src/lib/auth.ts',
            relevanceScore: 88,
            riskLevel: 'medium',
            reason: 'Cryptographic utilities and JWT token lifecycle management engine.',
            suggestedAction: 'review',
            relatedFiles: ['src/api/auth/login.ts', 'src/config/jwt.ts'],
            estimatedComplexity: 55
          },
          {
            file: 'src/middleware/auth.ts',
            relevanceScore: 82,
            riskLevel: 'low',
            reason: 'Routing interceptor for edge validation and protected scope enforcement.',
            suggestedAction: 'review',
            relatedFiles: ['src/lib/auth.ts'],
            estimatedComplexity: 40
          },
          {
            file: 'src/api/auth/register.ts',
            relevanceScore: 75,
            riskLevel: 'low',
            reason: 'User entry-point flow, structurally identical to targeted logic.',
            suggestedAction: 'review',
            relatedFiles: ['src/lib/auth.ts', 'src/models/User.ts'],
            estimatedComplexity: 45
          },
          {
            file: 'src/utils/crypto.ts',
            relevanceScore: 45,
            riskLevel: 'high',
            reason: 'Core hashing algorithms. High risk of breaking security protocols if modified.',
            suggestedAction: 'avoid',
            relatedFiles: [],
            estimatedComplexity: 85
          }
        ],
        confidence: 94,
        generatedAt: new Date().toISOString()
      };

      setResult(mockResult);
      if (mockResult.suggestions.length > 0) setSelectedSuggestion(mockResult.suggestions[0]);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900 px-2">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.3em] italic">
                 /archive/neural-discovery
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                File <span className="not-italic text-gray-500">Discovery</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Specify your technical objective and synthesize architectural relevance vectors.
              </p>
           </div>
           
           <div className="flex items-center gap-6 bg-gray-900/40 p-4 rounded-3xl border border-gray-800 shadow-2xl">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Search Engine</div>
                 <div className="text-xl font-black text-indigo-400 italic tracking-tighter uppercase tabular-nums">Neural-V3</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <BrainCircuit className="h-5 w-5 text-indigo-400 shadow-2xl" />
              </div>
           </div>
        </header>

        <Card className="bg-gray-900/60 border border-indigo-500/20 p-2 rounded-4xl md:rounded-5xl overflow-hidden backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(79,70,229,0.2)] mx-2">
          <CardContent className="p-4">
             <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row gap-4">
                   <div className="flex-1 relative">
                      <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-indigo-400 transition-colors" />
                      <Input
                        placeholder="Define discovery objective (e.g. 'implement OAUTH2 flow')"
                        className="h-16 pl-16 pr-8 bg-black/60 border-gray-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/40 text-white placeholder:text-gray-800 text-[11px] md:text-[13px] rounded-2xl font-black italic uppercase tracking-[0.05em] transition-all shadow-inner"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                      />
                   </div>
                   <Button
                    className="h-16 px-10 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 italic"
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                   >
                    {loading ? (
                      <div className="flex items-center gap-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing Vector Space
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Sparkles className="h-4 w-4" />
                        Execute Discovery
                      </div>
                    )}
                   </Button>
                </div>
             </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12 px-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: "Discovery Query", val: `"${result.query}"`, icon: Target, isText: true },
                  { label: "Engine Confidence", val: `${result.confidence}%`, icon: Sparkles, color: "text-indigo-400" },
                  { label: "Nodes Resolved", val: result.suggestions.length, icon: Cpu, color: "text-purple-400" }
                ].map((stat, i) => (
                  <Card key={i} className="bg-gray-900/40 border border-gray-800 p-8 rounded-4xl flex flex-col items-center text-center group hover:border-indigo-500/20 transition-all shadow-2xl">
                     <div className="h-12 w-12 rounded-2xl bg-black border border-gray-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                        <stat.icon className={`h-6 w-6 ${stat.color || 'text-gray-700'}`} />
                     </div>
                     <div className="text-[10px] uppercase font-black text-gray-700 tracking-[0.3em] mb-4 italic">{stat.label}</div>
                     <div className={`font-black tracking-tighter italic uppercase leading-tight ${stat.isText ? 'text-[11px] text-indigo-300 break-all px-4 tracking-widest' : 'text-5xl text-white tabular-nums'}`}>
                        {stat.val}
                     </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                  <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Resolved File Vectors</div>
                  <div className="space-y-4 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                    {result.suggestions.map((suggestion, idx) => {
                      const config = ActionConfig[suggestion.suggestedAction as keyof typeof ActionConfig];
                      const Icon = config.icon;
                      
                      return (
                        <motion.div
                          key={suggestion.file}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card
                            className={`group cursor-pointer bg-gray-900/40 border-2 rounded-4xl overflow-hidden transition-all duration-300 ${
                              selectedSuggestion?.file === suggestion.file
                                ? 'border-indigo-500/60 bg-indigo-500/05 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]'
                                : 'border-gray-900 hover:border-gray-800'
                            }`}
                            onClick={() => setSelectedSuggestion(suggestion)}
                          >
                            <CardContent className="p-8">
                               <div className="flex items-start justify-between gap-10">
                                  <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-4 rounded-xl border-2 ${config.bg} ${config.border} shadow-inner`}>
                                           <Icon className={`h-5 w-5 ${config.text}`} />
                                        </div>
                                        <div className="min-w-0">
                                           <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate italic">
                                             {suggestion.file.split('/').pop()}
                                           </h3>
                                           <div className="text-[10px] text-gray-700 font-mono italic truncate mt-1 tracking-tight opacity-60">{suggestion.file}</div>
                                        </div>
                                     </div>
                                     
                                     <div className="flex items-center gap-12 pt-6 border-t border-gray-800/50 mt-4">
                                        <div className={`text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border italic ${config.bg} ${config.border} ${config.text}`}>
                                           {config.label}
                                        </div>
                                        <div className="flex items-center gap-3 grayscale opacity-40 group-hover:opacity-80 transition-opacity">
                                           <AlertTriangle className="h-4 w-4 text-gray-500" />
                                           <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 shrink-0 italic">{suggestion.riskLevel} Risk Tier</span>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-center gap-3 bg-black/40 p-5 rounded-2xl border border-gray-800 shadow-inner group-hover:border-indigo-500/20 transition-all shrink-0">
                                     <div className="text-2xl font-black text-indigo-400 italic tracking-tighter tabular-nums leading-none">{suggestion.relevanceScore}%</div>
                                     <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest italic">Relevance</div>
                                     <ChevronRight className={`h-5 w-5 text-gray-800 mt-4 transition-transform ${selectedSuggestion?.file === suggestion.file ? 'translate-x-1 text-indigo-400' : ''}`} />
                                  </div>
                               </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-12 xl:col-span-5 xl:sticky xl:top-8">
                   <AnimatePresence mode="wait">
                    {selectedSuggestion ? (
                      <motion.div
                        key={selectedSuggestion.file}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                         <Card className="bg-gray-900/60 border border-indigo-500/20 rounded-5xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative">
                            <div className="h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-rose-500" />
                            <CardContent className="p-10 space-y-12">
                               <header>
                                  <div className="flex items-center justify-between mb-8">
                                     <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] uppercase font-black text-indigo-400 tracking-[0.2em] italic">Vector Inspection Active</div>
                                     <Maximize2 className="h-6 w-6 text-indigo-400" />
                                  </div>
                                  <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic leading-none break-all">{selectedSuggestion.file.split('/').pop()}</h2>
                                  <div className="p-5 rounded-2xl bg-black border border-gray-800 group/code relative overflow-hidden shadow-inner">
                                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/40" />
                                     <p className="text-[10px] font-mono text-gray-700 break-all italic group-hover/code:text-gray-500 transition-colors tracking-tight leading-relaxed">{selectedSuggestion.file}</p>
                                  </div>
                               </header>

                               <div className="space-y-4">
                                  <div className="text-[10px] uppercase font-black text-gray-800 tracking-[0.4em] px-1 italic">AI Strategic Rationale</div>
                                  <div className="p-8 rounded-4xl bg-indigo-500/05 border border-indigo-500/10 relative overflow-hidden group/rational shadow-inner">
                                     <div className="absolute top-0 right-0 p-4">
                                        <Sparkles className="h-5 w-5 text-indigo-500 opacity-10 group-hover/rational:opacity-30 transition-opacity" />
                                     </div>
                                     <p className="text-sm text-gray-500 italic font-medium leading-relaxed">
                                       " {selectedSuggestion.reason} "
                                     </p>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-6">
                                  <div className="p-8 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                                     <div className="text-[10px] uppercase font-black text-gray-700 tracking-widest flex items-center gap-3 italic">
                                        <TrendingUp className="h-3 w-3" />
                                        Complexity
                                     </div>
                                     <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{selectedSuggestion.estimatedComplexity}%</div>
                                     <div className="text-[9px] font-black text-gray-800 uppercase italic">Unit Density</div>
                                  </div>
                                  <div className="p-8 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                                     <div className="text-[10px] uppercase font-black text-gray-700 tracking-widest flex items-center gap-3 italic">
                                        <Fingerprint className="h-3 w-3" />
                                        Integrity
                                     </div>
                                     <div className={`text-2xl font-black uppercase italic tracking-tighter ${selectedSuggestion.riskLevel === 'high' ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedSuggestion.riskLevel}</div>
                                     <div className="text-[9px] font-black text-gray-800 uppercase italic">Reliability</div>
                                  </div>
                               </div>

                               {selectedSuggestion.relatedFiles.length > 0 && (
                                  <div className="space-y-6">
                                     <div className="text-[10px] uppercase font-black text-gray-800 tracking-[0.4em] px-1 italic">Dependency Cluster</div>
                                     <div className="space-y-3">
                                        {selectedSuggestion.relatedFiles.map((file, i) => (
                                          <div key={i} className="group/row flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-gray-900 hover:border-indigo-500/30 transition-all duration-300 shadow-inner">
                                             <div className="flex items-center gap-5">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-500/05 border border-indigo-500/10 flex items-center justify-center">
                                                   <Binary className="h-4 w-4 text-indigo-900 group-hover/row:text-indigo-400 transition-colors" />
                                                </div>
                                                <span className="text-[10px] font-mono text-gray-700 group-hover/row:text-gray-400 transition-colors tracking-tight italic">{file}</span>
                                             </div>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                               )}

                               <Button className="w-full h-18 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-4 group italic active:scale-95">
                                  <Zap className="h-4 w-4" />
                                  Hydrate Environment
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                               </Button>
                            </CardContent>
                         </Card>
                      </motion.div>
                    ) : (
                      <div className="h-[750px] flex flex-col items-center justify-center bg-gray-900/10 border-2 border-dashed border-gray-800 rounded-5xl opacity-40 space-y-8">
                         <div className="h-24 w-24 rounded-4xl bg-black border border-gray-800 flex items-center justify-center shadow-inner">
                            <BrainCircuit className="h-10 w-10 text-gray-800" />
                         </div>
                         <p className="text-gray-700 font-black uppercase tracking-[0.4em] text-[10px] px-2 text-center italic">Awaiting discovery vector selection</p>
                      </div>
                    )}
                   </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
             <div className="h-[500px] flex flex-col items-center justify-center bg-gray-900/10 border-2 border-dashed border-gray-800 rounded-5xl space-y-10 opacity-40 mx-2 shadow-inner">
                <div className="h-28 w-28 rounded-4xl bg-black border border-gray-800 flex items-center justify-center shadow-2xl">
                   <Compass className="h-12 w-12 text-gray-800" />
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-3xl font-black text-gray-800 uppercase tracking-widest italic">Awaiting Objective</h3>
                   <p className="text-gray-700 font-medium italic text-lg px-6 max-w-lg mx-auto">Submit a technical objective above to synthesize reactive architectural relevance vectors.</p>
                </div>
             </div>
          )}
        </AnimatePresence>

        <div className="mx-2 p-12 md:p-20 rounded-5xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-16 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="h-24 w-24 rounded-4xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <Zap className="h-12 w-12 text-indigo-400" />
           </div>
           <div className="flex-1 space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 italic">Discovery Optimizer Protocol</h4>
              <p className="text-gray-500 font-medium italic text-lg leading-relaxed">
                  Describe specific architectural layers for higher precision. Queries like <span className="text-indigo-400 font-black italic">"fix memory leak in websocket middleware"</span> resolve with 2.4x higher accuracy than generic technical permutations.
              </p>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Neural Discovery Active
           </div>
           <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="h-3.5 w-3.5 text-gray-800" />
                 <span className="opacity-60 text-[9px] uppercase font-black">Archive: Institutional Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                 <Binary className="h-3.5 w-3.5 text-gray-800" />
                 <span className="opacity-60 text-[9px] uppercase font-black">Search v5.2.0</span>
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
