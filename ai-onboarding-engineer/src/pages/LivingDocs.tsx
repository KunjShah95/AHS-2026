import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  FileText, 
  RefreshCw, 
  Search, 
  Clock, 
  Sparkles,
  Fingerprint,
  Layers
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLivingDocs, updateLivingDoc } from '@/lib/advanced-features-db';
import type { LivingDoc } from '@/lib/types/advanced-features';

export default function LivingDocs() {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<LivingDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LivingDoc | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      const data = await getLivingDocs(repoId);
      setDocs(data);
      if (data.length > 0) setSelectedDoc(data[0]);
    } catch (error) {
      console.error('Error loading living docs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const refreshDoc = async (id: string) => {
    await updateLivingDoc(id, {
      content: "Regenerating institutional knowledge...",
      lastGenerated: new Date().toISOString()
    });
    loadDocs();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BookOpen className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Synthesizing Institutional Literature...</span>
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
                 /arch/living-documentation
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Living <span className="not-italic text-gray-500">Documentation</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Always-current technical literature synchronized with institutional artifact evolution.
              </p>
           </div>
           
           <Button className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3 shadow-2xl">
              <RefreshCw className="h-4 w-4" />
              Re-sync Archive
           </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 px-2 italic">Institutional Index</div>
              <div className="space-y-3">
                 {docs.map((doc_item) => (
                   <div 
                     key={doc_item.id}
                     onClick={() => setSelectedDoc(doc_item)}
                     className={`group cursor-pointer p-6 rounded-3xl border transition-all relative overflow-hidden ${
                       selectedDoc?.id === doc_item.id 
                         ? 'bg-indigo-500/10 border-indigo-500/30' 
                         : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                     }`}
                   >
                      <div className="flex items-center justify-between mb-4">
                         <div className="h-8 w-8 rounded-lg bg-black border border-gray-800 flex items-center justify-center">
                            <Layers className={`h-4 w-4 ${selectedDoc?.id === doc_item.id ? 'text-indigo-400' : 'text-gray-600'}`} />
                         </div>
                         <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">v{doc_item.versionHistory.length}.0</div>
                      </div>
                      <h3 className="text-lg font-black uppercase italic tracking-tight text-white mb-2">{doc_item.title}</h3>
                      <div className="flex items-center gap-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">
                         <Clock className="h-3 w-3" />
                         {new Date(doc_item.lastGenerated).toLocaleDateString()}
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-8 rounded-4xl bg-indigo-600/05 border border-indigo-500/10 space-y-6">
                 <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic">AI Sync Logic</span>
                 </div>
                 <p className="text-xs font-bold text-gray-600 italic leading-relaxed">
                    Documentation is synthesized via AST parsing and cognitive mapping, ensuring 1:1 parity with artifact changes.
                 </p>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-8">
              {selectedDoc ? (
                <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
                   <div className="p-10 border-b border-gray-800/50 flex items-center justify-between bg-black/20">
                      <div className="flex items-center gap-6">
                         <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-indigo-400" />
                         </div>
                         <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">{selectedDoc.title}</h2>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mt-1 italic">Knowledge Tier: Institutional Core</div>
                         </div>
                      </div>
                      <Button variant="ghost" onClick={() => refreshDoc(selectedDoc.id)} className="h-10 w-10 p-0 rounded-xl hover:bg-white hover:text-black transition-all">
                         <RefreshCw className="h-4 w-4" />
                      </Button>
                   </div>
                   <CardContent className="p-10 space-y-12">
                      {selectedDoc.sections.map((section, idx) => (
                        <div key={idx} className="space-y-6">
                           <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-4">
                              <div className="text-[10px] font-black text-indigo-500 tabular-nums bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">0{idx + 1}</div>
                              {section.title}
                           </h3>
                           <div className="prose prose-invert prose-sm max-w-none text-gray-400 font-medium italic leading-relaxed">
                              {section.content}
                           </div>
                           <div className="flex flex-wrap gap-2 pt-4">
                              {section.sourceFiles.map((file, i) => (
                                <Badge key={i} variant="outline" className="bg-black/40 border-gray-800 text-[9px] font-mono text-gray-600 py-1.5 px-3 uppercase tracking-widest italic rounded-full">
                                   {file}
                                </Badge>
                              ))}
                           </div>
                        </div>
                      ))}
                   </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full border border-dashed border-gray-800 rounded-4xl p-20 opacity-40">
                   <Search className="h-12 w-12 text-gray-800 mb-6" />
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">Select an Archive Artifact</div>
                </div>
              )}

              <div className="p-10 rounded-4xl bg-linear-to-br from-indigo-900/10 to-black border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="space-y-2 text-center md:text-left">
                    <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">Knowledge Synchronization</div>
                    <p className="text-gray-400 text-sm font-medium italic">Enable auto-update cluster to maintain parity with every primary artifact commit.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest italic">In-Sync</span>
                    <div className="w-14 h-8 bg-indigo-500 rounded-full border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center px-1">
                       <div className="h-6 w-6 bg-white rounded-full ml-auto shadow-xl" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Documentation Matrix v2.2.0
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <Fingerprint className="h-3 w-3 text-gray-800" />
               Institutional Identity Verified
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  );
}
