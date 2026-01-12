import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Activity,
  Zap,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { getCTOSnapshot } from '@/lib/advanced-features-db';
import type { CTOSnapshot } from '@/lib/types/advanced-features';

export default function CTODashboard() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<CTOSnapshot | null>(null);

  const loadSnapshot = useCallback(async () => {
    try {
      setLoading(true);
      const teamId = localStorage.getItem('teamId') || 'demo-team';
      const snapshotData = await getCTOSnapshot(teamId);
      setSnapshot(snapshotData);
    } catch (error) {
      console.error('Error loading snapshot:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-rose-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return 'text-emerald-400';
      case 'declining':
        return 'text-rose-500';
      default:
        return 'text-gray-500';
    }
  };

  const getBusFactorHealth = (busFactor: number) => {
    if (busFactor >= 5) return { label: 'Optimal', color: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (busFactor >= 3) return { label: 'Moderate', color: 'text-amber-400', border: 'border-amber-500/20' };
    return { label: 'Fragile', color: 'text-rose-500', border: 'border-rose-500/20' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Aggregating Organizational Intelligence...</span>
      </div>
    );
  }

  const busFactorHealth = snapshot ? getBusFactorHealth(snapshot.knowledgeRisk.busFactor) : null;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/executive-sync
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Engineering <span className="not-italic text-gray-500">Intelligence</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                High-fidelity telemetry of organizational health, knowledge liquidity, and scaling efficiency.
              </p>
           </div>
           
           <Button
             className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3 shadow-2xl"
             onClick={loadSnapshot}
           >
             <RefreshCw className="h-4 w-4" />
             Re-sync Intelligence
           </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "Active Talent", val: snapshot?.onboardingHealth.activeLearners, icon: Users, color: "text-indigo-400", sub: "Scaling Workforce" },
             { label: "Ramp Velocity", val: `${snapshot?.onboardingHealth.averageProgress}%`, icon: Target, color: "text-indigo-400", progress: snapshot?.onboardingHealth.averageProgress },
             { label: "Critical Support", val: snapshot?.onboardingHealth.atRiskDevelopers, icon: AlertTriangle, color: snapshot && snapshot.onboardingHealth.atRiskDevelopers > 0 ? "text-amber-500" : "text-gray-600", sub: "Out of Band" },
             { label: "Bus Factor", val: snapshot?.knowledgeRisk.busFactor, icon: Shield, color: busFactorHealth?.color, sub: `Health: ${busFactorHealth?.label}` }
           ].map((stat, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/30 transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-8">
                       <div className="h-12 w-12 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                          <stat.icon className={`h-6 w-6 ${stat.color} ${stat.label === 'Critical Support' && snapshot && snapshot.onboardingHealth.atRiskDevelopers > 0 ? 'animate-pulse' : ''}`} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{stat.label}</span>
                    </div>
                    <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums mb-2">
                      {stat.val || 0}
                    </div>
                    {stat.progress !== undefined ? (
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mt-6 border border-gray-800 shadow-inner">
                         <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${stat.progress}%` }} />
                      </div>
                    ) : (
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 mt-4">{stat.sub}</div>
                    )}
                  </CardContent>
                </Card>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-gray-800/50 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-4 italic">
                <Users className="h-5 w-5 text-indigo-400" />
                Workforce Health
              </h2>
            </div>
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-6">
                 <div className="p-8 bg-black/40 rounded-3xl border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2 group hover:border-emerald-500/20 transition-all">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Effective Sync</div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">{(snapshot?.onboardingHealth.activeLearners || 0) - (snapshot?.onboardingHealth.atRiskDevelopers || 0)}</div>
                    <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/05 rounded-full border border-emerald-500/20">Operational</div>
                 </div>
                 <div className="p-8 bg-black/40 rounded-3xl border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2 group hover:border-rose-500/20 transition-all">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Support Buffer</div>
                    <div className="text-4xl font-black text-rose-500 italic tracking-tighter">{snapshot?.onboardingHealth.atRiskDevelopers || 0}</div>
                    <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest px-3 py-1 bg-rose-500/05 rounded-full border border-rose-500/20">Stalled Nodes</div>
                 </div>
              </div>

              {snapshot && snapshot.onboardingHealth.atRiskDevelopers > 0 && (
                <div className="p-8 bg-amber-500/05 border border-amber-500/20 rounded-3xl flex items-start gap-6 shadow-[0_20px_50px_-20px_rgba(245,158,11,0.15)]">
                   <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
                   <div className="space-y-2">
                       <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Strategy Intervention Required</div>
                       <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                          Abnormal friction detected in the current cohort cluster. High probability of bottleneck at <span className="text-white font-black text-base">Architectural Synthesis (Phase 4)</span>.
                       </p>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-gray-800/50 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-4 italic">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                Knowledge Liquidity
              </h2>
            </div>
            <CardContent className="p-10 space-y-10">
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Distribution Coefficient</span>
                     <span className="text-[10px] font-black uppercase text-indigo-400 tabular-nums">{snapshot?.knowledgeRisk.distributionScore || 0}% Sync</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${snapshot?.knowledgeRisk.distributionScore || 0}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                     />
                  </div>
               </div>

               {snapshot && snapshot.knowledgeRisk.criticalSinglePoints.length > 0 && (
                <div className="space-y-6">
                   <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-2 italic">Institutional Vulnerabilities</div>
                   <div className="grid grid-cols-1 gap-3">
                     {snapshot.knowledgeRisk.criticalSinglePoints.slice(0, 3).map((file, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-gray-800 rounded-2xl group hover:border-rose-500/20 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="h-8 w-8 rounded-lg bg-rose-500/05 border border-rose-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-3 w-3 text-rose-500" />
                             </div>
                             <span className="text-[11px] font-mono text-gray-500 group-hover:text-rose-400 transition-colors truncate">{file}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-gray-700 tracking-widest">SPOF Node</span>
                       </div>
                     ))}
                   </div>
                </div>
               )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
             <div className="p-10 border-b border-gray-800/50 flex items-center justify-between">
               <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-4 italic">
                 <Clock className="h-5 w-5 text-indigo-400" />
                 Productivity Convergence
               </h2>
             </div>
             <CardContent className="p-10 space-y-10">
                <div className="flex items-center justify-between p-8 bg-black/40 rounded-3xl border border-gray-800 shadow-inner">
                   <div>
                      <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{snapshot?.timeToProductivity.average || 0} <span className="text-sm text-gray-600 font-medium not-italic uppercase tracking-widest">Days</span></div>
                      <div className="text-[10px] font-black text-gray-700 mt-2 uppercase tracking-widest">Mean Time to Primary Artifact commit</div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                       <div className="h-10 w-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shadow-lg">
                          {snapshot && getTrendIcon(snapshot.timeToProductivity.trend)}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${snapshot ? getTrendColor(snapshot.timeToProductivity.trend) : 'text-gray-500'}`}>
                         Sequence {snapshot?.timeToProductivity.trend || 'stable'}
                       </span>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-2 italic">Convergence by Node Tier</div>
                   <div className="space-y-6">
                      {snapshot && snapshot.timeToProductivity.byRole.map((role, idx) => (
                        <div key={idx} className="space-y-3 px-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{role.role}</span>
                              <span className="text-[10px] font-black text-white italic tracking-widest">{role.avgTime} Cycle Days</span>
                           </div>
                           <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min(100, (role.avgTime / 60) * 100)}%` }}
                                 transition={{ duration: 1.2, delay: idx * 0.1, ease: "circOut" }}
                                 className="h-full bg-indigo-500/40" 
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
             <div className="p-10 border-b border-gray-800/50 flex items-center justify-between">
               <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-4 italic">
                 <Zap className="h-5 w-5 text-indigo-400" />
                 Sustainment Velocity
               </h2>
             </div>
             <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 bg-black/40 rounded-3xl border border-gray-800 shadow-inner space-y-6 group hover:border-indigo-500/20 transition-all">
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic px-1">Artifact Fidelity Score</div>
                      <div className="flex items-baseline gap-4 px-1">
                         <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{snapshot?.teamVelocity.codeQualityScore || 0}</div>
                         <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">/ 100 Sync</div>
                      </div>
                      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner border border-gray-800">
                          <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${snapshot?.teamVelocity.codeQualityScore || 0}%` }} />
                      </div>
                   </div>

                   <div className="p-8 bg-black/40 rounded-3xl border border-gray-800 shadow-inner space-y-6 group hover:border-purple-500/20 transition-all">
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic px-1">Cohesion Index</div>
                      <div className="flex items-baseline gap-4 px-1">
                         <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{snapshot?.teamVelocity.collaborationIndex || 0}</div>
                         <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">/ 100 Sync</div>
                      </div>
                      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner border border-gray-800">
                          <div className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" style={{ width: `${snapshot?.teamVelocity.collaborationIndex || 0}%` }} />
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.2)]">
                   <div className="text-center md:text-left mb-4 md:mb-0">
                      <div className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-1">Throughput Capacity</div>
                      <div className="text-gray-400 text-sm font-medium italic">Targeted weekly institutional contributions.</div>
                   </div>
                   <div className="text-3xl font-black text-white italic tracking-tighter tabular-nums">
                      {snapshot?.teamVelocity.tasksPerPerson.toFixed(1) || 0} 
                      <span className="text-[10px] ml-4 font-black text-indigo-400 uppercase tracking-[0.2em] not-italic">Nodes / Cycle</span>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            Intelligence Cluster Active
         </div>
         <div>Institutional Snapshot: {snapshot ? new Date(snapshot.generatedAt).toLocaleString() : 'Pending'}</div>
      </footer>
    </div>
  );
}
