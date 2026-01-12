import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Flame,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Zap,
  Binary,
  ShieldCheck,
  ChevronRight,
  Gauge,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getLearningStreak, getConfidenceMetrics } from '@/lib/advanced-features-db';
import type { LearningStreak, ConfidenceMetrics } from '@/lib/types/advanced-features';
import { Button } from '@/components/ui/button';

export default function LearningProgress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<LearningStreak | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceMetrics | null>(null);

  const loadProgressData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';

      const [streakData, confidenceData] = await Promise.all([
        getLearningStreak(user.uid),
        getConfidenceMetrics(user.uid, repoId)
      ]);

      setStreak(streakData);
      setConfidence(confidenceData);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData, user]);

  const getStreakDescription = (days: number) => {
    if (days === 0) return 'Initialize your interaction sequence today';
    if (days === 1) return 'Connection established - maintain bandwidth';
    if (days < 7) return 'Building consistent logic pathways';
    if (days < 30) return 'High-bandwidth integration active';
    return 'Full institutional synchronization';
  };

  const getConfidenceLevel = (score: number) => {
    if (score < 20) return { label: 'Explorer', color: 'text-gray-600' };
    if (score < 40) return { label: 'Novice', color: 'text-amber-500' };
    if (score < 60) return { label: 'Practitioner', color: 'text-indigo-400' };
    if (score < 80) return { label: 'Proficient', color: 'text-emerald-400' };
    return { label: 'Specialist', color: 'text-purple-400' };
  };

  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const isActive = streak?.streakHistory?.some(
        h => h.date.startsWith(dateStr) && h.active
      ) || false;

      days.push({
        date: dateStr,
        active: isActive,
        isToday: i === 0
      });
    }
    
    return days;
  };

  const calendarDays = streak ? getCalendarDays() : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px] italic">Extracting Performance Telemetry...</span>
      </div>
    );
  }

  const confidenceLevel = confidence ? getConfidenceLevel(confidence.overallConfidence) : null;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900 px-2">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic">
                 /archive/growth-telemetry
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Mastery <span className="not-italic text-gray-500">Vector</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Performance diagnostics and architectural synchronization status.
              </p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Current Level</div>
                 <div className={`text-2xl font-black italic tracking-tighter ${confidenceLevel?.color}`}>{confidenceLevel?.label}</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Gauge className="h-6 w-6 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
          {[
            { label: "Active Streak", val: streak?.currentStreak, icon: Flame, color: "text-orange-500", desc: getStreakDescription(streak?.currentStreak || 0) },
            { label: "Peak Performance", val: streak?.longestStreak, icon: Award, color: "text-purple-400", desc: "Highest consecutive metrics" },
            { label: "Institutional Yield", val: `${confidence?.overallConfidence}%`, icon: TrendingUp, color: "text-emerald-400", desc: "Overall architectural mastery" }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="group relative overflow-hidden bg-gray-900/40 border border-gray-800 rounded-4xl hover:border-indigo-500/30 transition-all shadow-2xl">
                <CardContent className="p-10 relative">
                  <div className="flex items-start justify-between mb-8">
                     <div className="h-12 w-12 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">{stat.label}</span>
                  </div>
                  <div className="text-5xl font-black text-white italic tracking-tighter mb-4 tabular-nums uppercase">
                    {stat.val || 0}
                  </div>
                  <p className="text-gray-500 font-medium italic text-sm">
                    {stat.desc}
                  </p>
                  {i === 0 && streak && streak.currentStreak > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-800/50 flex items-center gap-2 text-orange-500 text-[9px] font-black uppercase tracking-widest italic">
                      <Zap className="h-3 w-3" />
                      Momentum Multiplier Active
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
          <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-gray-800/50 flex items-center justify-between bg-black/20">
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-4 italic leading-none">
                <Calendar className="h-5 w-5 text-indigo-400" />
                Consistency Spectrum
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">90 Day Resolution</span>
            </div>
            <CardContent className="p-10">
              <div className="flex justify-center">
                 <div className="grid grid-cols-15 gap-2">
                   {calendarDays.map((day, idx) => (
                     <motion.div
                       key={day.date}
                       initial={{ opacity: 0, scale: 0.8 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: idx * 0.003 }}
                       className={`
                         h-3 w-3 rounded-sm transition-all relative group cursor-pointer
                         ${day.active 
                           ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-400' 
                           : 'bg-white/05 hover:bg-white/10'}
                         ${day.isToday ? 'outline outline-white outline-offset-2' : ''}
                       `}
                     >
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                         <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-2xl italic">
                           {day.date} {day.isToday && '(Current)'}
                         </div>
                       </div>
                     </motion.div>
                   ))}
                 </div>
              </div>
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-800/50">
                <div className="flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-white/05" />
                    <span>Idle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <span>Engaged</span>
                  </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 italic tabular-nums">
                  {calendarDays.filter(d => d.active).length} Activity Clusters
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-gray-800/50 flex items-center justify-between bg-black/20">
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-4 italic leading-none">
                <Target className="h-5 w-5 text-indigo-400" />
                Skill Distribution
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 italic">Domain Resolution</span>
            </div>
            <CardContent className="p-10 space-y-8">
              {confidence && confidence.confidenceByModule && confidence.confidenceByModule.length > 0 ? (
                confidence.confidenceByModule.map((module, idx) => (
                  <motion.div
                    key={module.module}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 italic leading-none">{module.module}</span>
                      <span className="text-[10px] font-black uppercase text-indigo-400 tabular-nums italic leading-none">{module.score}% Sync</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${module.score}%` }}
                        transition={{ delay: idx * 0.1 + 0.3, duration: 1, ease: "circOut" }}
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="h-14 w-14 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center shadow-inner">
                    <Binary className="h-6 w-6 text-gray-800" />
                  </div>
                  <p className="text-gray-700 font-black italic text-sm uppercase tracking-[0.3em]">No domain clusters analyzed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {streak && streak.achievementsUnlocked && streak.achievementsUnlocked.length > 0 && (
          <div className="space-y-8 px-2">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Unlocked Milestones</h2>
               <div className="h-px flex-1 mx-8 bg-gray-900" />
               <div className="text-[10px] font-black uppercase tracking-widest text-gray-800 italic">Archive Log</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {streak.achievementsUnlocked.map((achievement, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/40 transition-all flex flex-col items-center text-center p-8 shadow-2xl">
                    <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                      <ShieldCheck className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h4 className="font-black text-white uppercase tracking-tighter text-lg leading-none mb-2 italic">{achievement}</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700">Institutional Merit</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="p-10 mx-2 rounded-4xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-8 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/05 rounded-full blur-[100px] pointer-events-none" />
           <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <Zap className="h-8 w-8 text-indigo-400" />
           </div>
           <div className="flex-1 space-y-2 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Strategy Synthesis</h4>
              <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                Current performance suggests institutional synchronization in <span className="text-white font-bold italic">14 days</span>. Maintain consistent bandwidth windows to maximize proficiency yield.
              </p>
           </div>
           <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-2xl flex items-center gap-3 italic transition-all active:scale-95">
              Engage Path <ChevronRight className="h-4 w-4" />
           </Button>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Progress Engine Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Vectors v2.4.1
              </div>
              <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
