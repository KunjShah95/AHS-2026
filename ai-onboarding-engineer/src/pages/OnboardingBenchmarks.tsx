import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Zap,
  Gauge,
  Trophy,
  ShieldCheck,
  Star,
  Binary
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOnboardingMetrics, calculateOnboardingBenchmark } from '@/lib/advanced-features-db';
import type { OnboardingMetrics, OnboardingBenchmark } from '@/lib/types/advanced-features';

export default function OnboardingBenchmarks() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myMetrics, setMyMetrics] = useState<OnboardingMetrics | null>(null);
  const [benchmark, setBenchmark] = useState<OnboardingBenchmark | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      
      const [metrics, bench] = await Promise.all([
        getOnboardingMetrics(user.uid, repoId),
        calculateOnboardingBenchmark(repoId)
      ]);

      setMyMetrics(metrics);
      setBenchmark(bench);
    } catch (error) {
      console.error('Error loading benchmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Gauge className="h-10 w-10 animate-spin text-emerald-500 shadow-2xl" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-[10px] italic">Calibrating velocity vectors...</span>
      </div>
    );
  }

  const myTime = myMetrics?.totalOnboardingTime || 0;
  const avgTime = benchmark?.averageOnboardingTime || 0;
  const performance = myTime > 0 && avgTime > 0
    ? Math.round(((avgTime - myTime) / avgTime) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900 px-2">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2 font-mono text-[10px] text-emerald-300 uppercase tracking-[0.3em] italic">
                 /archive/onboarding-velocity
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Onboarding <span className="not-italic text-gray-500">Speed</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Comparative analysis of ramp-up trajectories against organizational benchmarks.
              </p>
           </div>
           
           {performance > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex items-center gap-6 bg-emerald-500/05 border-2 border-emerald-500/20 rounded-3xl px-8 py-5 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.2)]"
             >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                   <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                   <div className="text-3xl font-black text-emerald-400 italic tracking-tighter tabular-nums leading-none">+{performance}%</div>
                   <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mt-2 italic">Efficiency Gain</div>
                </div>
             </motion.div>
           )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
           {[
             { label: "Individual velocity", val: myTime, unit: "days", icon: Clock, color: "text-indigo-400", sub: "Personal Ramp-up" },
             { label: "Institutional Mean", val: Math.round(avgTime), unit: "days", icon: Users, color: "text-purple-400", sub: "Team Average" },
             { label: "Velocity Delta", val: `${performance > 0 ? '+' : ''}${performance}`, unit: "%", icon: Zap, color: performance >= 0 ? "text-emerald-400" : "text-amber-400", sub: "vs Organization" },
             { label: "Record Trajectory", val: benchmark?.fastestOnboardingTime, unit: "days", icon: Trophy, color: "text-amber-500", sub: "Optimization Target" }
           ].map((stat, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
               <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-emerald-500/30 transition-all shadow-2xl">
                 <CardContent className="p-8">
                   <div className="flex items-start justify-between mb-8">
                      <div className="h-12 w-12 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                         <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">{stat.label}</span>
                   </div>
                   <div className="flex items-baseline gap-2">
                      <div className="text-5xl font-black text-white italic tracking-tighter tabular-nums">
                        {stat.val || 0}
                      </div>
                      <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none mb-1 italic px-1">{stat.unit}</div>
                   </div>
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-800 mt-6 border-t border-gray-800/50 pt-4 italic">{stat.sub}</div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] mx-2">
          <div className="p-10 border-b border-gray-800 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
              <Target className="h-6 w-6 text-emerald-400" />
              Onboarding Trajectory
            </h2>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 italic">Comparative Analysis Scale</div>
          </div>
          <CardContent className="p-10 md:p-14">
            <div className="space-y-16">
              {[
                { label: "Individual contribution progress", val: myTime, max: benchmark?.slowestOnboardingTime || myTime, color: "from-indigo-600 via-indigo-500 to-purple-500", text: "text-indigo-400", timeLabel: `${myTime} Days` },
                { label: "Organizational baseline average", val: avgTime, max: benchmark?.slowestOnboardingTime || avgTime, color: "from-gray-800 to-gray-700", text: "text-gray-500", timeLabel: `${Math.round(avgTime)} Days` },
                { label: "Production readiness benchmark", val: benchmark?.fastestOnboardingTime || 0, max: benchmark?.slowestOnboardingTime || 1, color: "from-amber-600 to-amber-500", text: "text-amber-500", timeLabel: `${benchmark?.fastestOnboardingTime || 0} Days` }
              ].map((row, i) => (
                <div key={i} className="relative group">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">{row.label}</span>
                    <span className={`text-[10px] font-black ${row.text} uppercase tracking-widest tabular-nums italic`}>{row.timeLabel}</span>
                  </div>
                  <div className="h-12 w-full bg-black/40 rounded-4xl overflow-hidden border border-gray-800 shadow-inner p-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (row.val / (row.max || 1)) * 100)}%` }}
                      transition={{ duration: 1.5, delay: i * 0.2, ease: "circOut" }}
                      className={`h-full bg-linear-to-r ${row.color} rounded-3xl relative shadow-[0_0_20px_rgba(255,255,255,0.05)]`}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-size-[24px_24px] opacity-20" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {benchmark?.topPerformers && benchmark.topPerformers.length > 0 && (
          <div className="space-y-8 px-2">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic flex items-center gap-4">
                 <ShieldCheck className="h-6 w-6 text-emerald-400" />
                 Institutional Performers
               </h2>
               <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Top contributors</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benchmark.topPerformers.map((performer, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-gray-900/40 border-2 border-gray-900 rounded-4xl hover:border-emerald-500/20 transition-all duration-300 group shadow-2xl overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black italic tracking-tighter shadow-inner ${
                          idx === 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                          idx === 1 ? 'bg-gray-400/10 text-gray-400 border border-gray-400/30' :
                          'bg-amber-900/10 text-amber-900 border border-amber-900/30'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-white italic tracking-tight truncate group-hover:text-emerald-400 transition-colors uppercase">{performer.name}</div>
                          <div className="text-[10px] text-gray-700 font-black uppercase tracking-widest mt-1 italic">{performer.role}</div>
                        </div>
                        <div className="text-right shrink-0 border-l border-gray-800/50 pl-6">
                          <div className="text-2xl font-black text-emerald-400 italic tracking-tighter tabular-nums leading-none">{performer.time}</div>
                          <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest mt-1 italic">Days</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-2 p-12 md:p-16 rounded-5xl bg-emerald-600/05 border border-emerald-500/10 flex flex-col md:flex-row items-center gap-16 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-emerald-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="h-24 w-24 rounded-4xl bg-white/05 border border-white/05 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <Star className="h-10 w-10 text-emerald-400 shadow-2xl" />
           </div>
           <div className="flex-1 space-y-6 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 italic">Performance Synthesis Active</h4>
              <p className="text-gray-500 font-medium italic text-lg leading-relaxed">
                 Trajectories above the <span className="text-white font-black">75th Percentile</span> correlate with 40% higher capital throughput. Current alignment suggests elite-tier achievement.
              </p>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              Velocity Calibration Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Vectors v4.6.1
              </div>
              <div>Institutional Resolution: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
