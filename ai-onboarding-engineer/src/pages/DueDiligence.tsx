import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Search, 
  Zap, 
  Database, 
  ArrowRight, 
  BarChart3, 
  RefreshCw,
  Cpu,
  History,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveDueDiligenceReport } from '@/lib/advanced-features-db';
import type { DueDiligenceReport } from '@/lib/types/advanced-features';

export default function DueDiligence() {
  const [repoUrl, setRepoUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<DueDiligenceReport | null>(null);

  const startScan = async () => {
    if (!repoUrl) return;
    setScanning(true);
    // Simulate complex scanning algorithm
    setTimeout(async () => {
      const mockReport: DueDiligenceReport = {
        repoUrl,
        complexityScore: 84,
        knowledgeRisk: 72,
        onboardingDifficulty: 65,
        estimatedOnboardingTime: 3,
        technicalDebt: {
          overall: 48,
          criticalIssues: [
            "Circular dependency cluster in Core/Modules",
            "High cyclomatic complexity in Authentication logic",
            "Missing architectural documentation for Database sharding"
          ]
        },
        teamSizeEstimate: {
          current: 12,
          recommended: 18
        },
        recommendations: [
          "Refactor Core data flow to unidirectional architecture",
          "Implement institutional knowledge graph",
          "Decouple monolith auth service into separate micro-nodes"
        ],
        comparisonMetrics: {
          vsIndustryAverage: +24,
          vsSimilarProjects: -12
        },
        generatedAt: new Date().toISOString()
      };
      
      await saveDueDiligenceReport(repoUrl, mockReport);
      setReport(mockReport);
      setScanning(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
                 /enterprise/acquisition-scanner
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Acquisition <span className="not-italic text-gray-500">Scanner</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                High-fidelity code audit and institutional risk assessment for mergers and acquisitions.
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Scanner State</div>
                 <div className="text-2xl font-black text-indigo-400 tabular-nums tracking-tighter">Ready to Audit</div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Search className="h-7 w-7 text-indigo-400" />
              </div>
           </div>
        </header>

        <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl p-10 overflow-hidden relative group">
           <div className="absolute inset-0 bg-indigo-500/05 group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
           <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4 w-full">
                 <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 italic px-2">Institutional Target URL</div>
                 <Input 
                   placeholder="https://github.com/org/target-repository" 
                   value={repoUrl}
                   onChange={(e) => setRepoUrl(e.target.value)}
                   className="h-16 bg-black/60 border-gray-800 text-lg font-mono rounded-2xl px-8 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700"
                 />
              </div>
              <Button 
                onClick={startScan}
                disabled={scanning}
                className="h-16 px-12 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl hover:bg-gray-200 transition-all disabled:opacity-50 min-w-64"
              >
                 {scanning ? (
                   <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Scanning Cluster...
                   </div>
                 ) : (
                   <div className="flex items-center gap-3">
                      Initialize Audit <ArrowRight className="h-4 w-4" />
                   </div>
                 )}
              </Button>
           </div>
        </Card>

        {report && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Complexity Density", val: report.complexityScore, icon: Cpu, color: "text-indigo-400" },
                  { label: "Institutional Risk", val: report.knowledgeRisk, icon: ShieldAlert, color: "text-rose-500" },
                  { label: "Onboarding Cycle", val: `${report.estimatedOnboardingTime}w`, icon: History, color: "text-amber-400" },
                  { label: "Structural Sync", val: report.technicalDebt.overall, icon: BarChart3, color: "text-indigo-400" }
                ].map((stat, i) => (
                  <Card key={i} className="bg-gray-900/40 border border-gray-800 rounded-4xl p-8 hover:border-indigo-500/20 transition-all relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon className="h-12 w-12 text-white" />
                     </div>
                     <div className="text-[10px] uppercase font-black text-gray-700 tracking-[0.2em] mb-4 italic">{stat.label}</div>
                     <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{stat.val}</div>
                  </Card>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
                   <CardHeader className="p-10 border-b border-gray-800/50 flex items-center justify-between">
                      <h2 className="text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-4">
                         <ShieldAlert className="h-5 w-5 text-rose-500" />
                         Technical Debt Clusters
                      </h2>
                   </CardHeader>
                   <CardContent className="p-10 space-y-6">
                      {report.technicalDebt.criticalIssues.map((issue, i) => (
                        <div key={i} className="flex gap-4 p-6 bg-rose-500/05 border border-rose-500/10 rounded-3xl group hover:border-rose-500/30 transition-all">
                           <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                           <p className="text-sm font-medium italic text-gray-400 leading-relaxed">{issue}</p>
                        </div>
                      ))}
                   </CardContent>
                </Card>

                <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
                   <CardHeader className="p-10 border-b border-gray-800/50 flex items-center justify-between">
                      <h2 className="text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-4">
                         <Zap className="h-5 w-5 text-indigo-400" />
                         Strategic Remediation
                      </h2>
                   </CardHeader>
                   <CardContent className="p-10 space-y-6">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 p-6 bg-indigo-500/05 border border-indigo-500/10 rounded-3xl group hover:border-indigo-500/30 transition-all">
                           <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                           <p className="text-sm font-medium italic text-indigo-300 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                   </CardContent>
                </Card>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl p-10 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="text-[10px] font-black uppercase text-gray-700 tracking-[0.3em] italic">Human Capital Delta</div>
                   <div className="flex items-baseline gap-6">
                      <div className="text-6xl font-black text-white italic tracking-tighter tabular-nums">{report.teamSizeEstimate.current}</div>
                      <ArrowRight className="h-6 w-6 text-gray-800" />
                      <div className="text-6xl font-black text-indigo-400 italic tracking-tighter tabular-nums">{report.teamSizeEstimate.recommended}</div>
                   </div>
                   <div className="text-xs font-bold text-gray-500 uppercase tracking-widest italic leading-relaxed">Recommended Workforce Scaling Node Shift</div>
                </Card>

                <div className="p-10 rounded-4xl bg-linear-to-br from-indigo-900/20 to-black border border-indigo-500/20 shadow-2xl space-y-8 flex flex-col justify-center">
                   <div className="space-y-4 text-center lg:text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">Full Institutional Valuation</h3>
                      <p className="text-gray-400 italic font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
                         Generate a detailed M&A readiness document including IP verification and institutional knowledge coverage.
                      </p>
                   </div>
                   <Button className="h-16 px-12 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-4">
                      Export Audit Cluster <Database className="h-4 w-4" />
                   </Button>
                </div>
             </div>
          </motion.div>
        )}
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Scanner Engine v9.0 Active
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <ShieldCheck className="h-3 w-3 text-gray-800" />
               Institutional Audit Lock-In
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  );
}
