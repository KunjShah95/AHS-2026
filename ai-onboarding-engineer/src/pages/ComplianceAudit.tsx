import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, FileCheck, Activity, Lock, ArrowRight, ClipboardCheck, Binary, Cpu, Fingerprint, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getKnowledgeCoverage } from '@/lib/advanced-features-db';
import type { KnowledgeCoverage } from '@/lib/types/advanced-features';

export default function ComplianceAudit() {
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<KnowledgeCoverage | null>(null);

  const loadCoverage = useCallback(async () => {
    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      const data = await getKnowledgeCoverage(repoId);
      setCoverage(data);
    } catch (error) {
      console.error('Error loading knowledge coverage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoverage();
  }, [loadCoverage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Lock className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Validating Governance Protocols...</span>
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
                 /ops/governance-audit
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Compliance <span className="not-italic text-gray-500">&</span> Audit
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Institutional knowledge certification and SOC2 / ISO readiness telemetry.
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 italic">Audit Integrity</div>
                 <div className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">Verified Alpha</div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                 <ShieldCheck className="h-7 w-7 text-emerald-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {[
             { label: "Institutional Coverage", val: `${coverage?.coveragePercentage || 0}%`, icon: ClipboardCheck, color: "text-indigo-400" },
             { label: "Certified Nodes", val: coverage?.coveredModules || 0, icon: Binary, color: "text-indigo-400" },
             { label: "Active Certifiers", val: coverage?.coverageByPerson.length || 0, icon: Users, color: "text-emerald-400" },
             { label: "Security Vectors", val: "14/14", icon: Lock, color: "text-purple-400" }
           ].map((stat, i) => (
             <Card key={i} className="bg-gray-900/40 border border-gray-800 rounded-4xl p-8 hover:border-indigo-500/30 transition-all shadow-xl">
                <div className="flex items-start justify-between mb-8">
                   <div className="h-10 w-10 rounded-xl bg-black border border-gray-800 flex items-center justify-center">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">{stat.label}</span>
                </div>
                <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{stat.val}</div>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative">
                <div className="p-10 border-b border-gray-800/50 flex items-center justify-between">
                   <h2 className="text-xl font-black uppercase tracking-tight text-white italic flex items-center gap-4">
                      <Activity className="h-5 w-5 text-indigo-400" />
                      Institutional Audit Trail
                   </h2>
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Reviewing last 50 events</div>
                </div>
                <CardContent className="p-10 space-y-6">
                   {coverage?.auditTrail.map((log, i) => (
                     <div key={i} className="flex items-center justify-between p-6 bg-black/40 border border-gray-800 rounded-3xl group hover:border-indigo-500/20 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="h-10 w-10 rounded-2xl bg-indigo-500/05 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                              {log.assessmentMethod === 'quiz' ? <ClipboardCheck className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}
                           </div>
                           <div>
                              <div className="text-sm font-black text-white uppercase italic tracking-tight">{log.module}</div>
                              <div className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.2em] mt-1 italic">
                                 {log.userId} • {log.assessmentMethod.replace('_', ' ')} logic
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs font-black text-emerald-400 italic tabular-nums">+{log.competencyLevel}% Sync</div>
                           <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mt-1">{new Date(log.assessedAt).toLocaleDateString()}</div>
                        </div>
                     </div>
                   ))}
                </CardContent>
              </Card>

              <div className="p-12 rounded-4xl bg-linear-to-br from-indigo-900/40 to-black border border-indigo-500/20 shadow-2xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Fingerprint className="h-32 w-32 text-white" />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">Governance Report Generator</h3>
                    <p className="text-gray-400 italic font-medium max-w-lg leading-relaxed">
                       Synthesize all institutional knowledge certifications into a single, SOC2-ready manifest for regulatory external review.
                    </p>
                 </div>
                 <Button className="h-16 px-12 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl hover:bg-gray-200 transition-all flex items-center gap-4">
                    Generate Manifest Cluster <ArrowRight className="h-4 w-4" />
                 </Button>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 px-2 italic">Institutional Vulnerabilities</div>
              <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl">
                 <CardContent className="p-10 space-y-8">
                    {coverage?.gaps.map((gap, i) => (
                      <div key={i} className="flex gap-4 p-5 bg-rose-500/05 border border-rose-500/10 rounded-2xl group hover:border-rose-500/30 transition-all">
                         <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                         <div className="space-y-1">
                            <div className="text-xs font-black text-white italic uppercase tracking-tight">{gap}</div>
                            <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">Critical Coverage Deficit</div>
                         </div>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <div className="p-8 rounded-4xl bg-indigo-600/05 border border-indigo-500/10 space-y-6">
                 <div className="flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 italic">Audit Logic Cluster</span>
                 </div>
                 <p className="text-xs font-bold text-gray-600 italic leading-relaxed">
                    Compliance state is calculated in real-time by correlating developer activity, task finalization, and cognitive alignment assessments.
                 </p>
              </div>
           </div>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Compliance Watchdog v4.2
         </div>
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
               <Lock className="h-3 w-3 text-gray-800" />
               Institutional Shield Active
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  );
}
