import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingDown,
  TrendingUp,
  Target,
  BookOpen,
  Activity,
  Award,
  AlertCircle,
  Zap,
  Clock,
  ChevronRight,
  BrainCircuit,
  ShieldCheck,
  Sparkles,
  Binary,
  Fingerprint,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDeveloperSkillProfile } from '@/lib/advanced-features-db';
import type { DeveloperSkillProfile, SkillGap } from '@/lib/types/advanced-features';

const SeverityConfig = {
  critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Urgent' },
  high: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'High' },
  medium: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', label: 'Moderate' },
  low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Minor' }
};

export default function SkillGaps() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DeveloperSkillProfile | null>(null);
  const [selectedGap, setSelectedGap] = useState<SkillGap | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const repoId = localStorage.getItem('currentRepoId') || 'demo-repo';
      const profileData = await getDeveloperSkillProfile(user.uid, repoId);
      setProfile(profileData);
      if (profileData.gaps.length > 0) setSelectedGap(profileData.gaps[0]);
    } catch (error) {
      console.error('Error loading skill profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BrainCircuit className="h-10 w-10 animate-pulse text-indigo-500" />
        <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Analyzing Competency Variance...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white py-12 px-6 flex items-center justify-center">
        <div className="max-w-md text-center space-y-8">
           <div className="h-24 w-24 rounded-4xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles className="h-10 w-10 text-gray-700" />
           </div>
           <div className="space-y-4">
              <h3 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Incomplete <span className="text-gray-600 not-italic">Profile</span></h3>
              <p className="text-gray-500 font-medium italic text-lg leading-relaxed">Synthesize architectural modules to unlock personalized variance analysis.</p>
           </div>
        </div>
      </div>
    );
  }

  const criticalGaps = profile.gaps.filter((g: { severity: string; }) => g.severity === 'critical');

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/competency-variance
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Gap <span className="not-italic text-gray-500">Analysis</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                AI-driven synthesis of friction points and architectural maturity vectors.
              </p>
           </div>
           
           <div className="flex items-center gap-6 bg-gray-900/40 p-4 rounded-3xl border border-gray-800 shadow-2xl">
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Active State</div>
                 <div className="text-xl font-black text-indigo-400 italic tracking-tighter uppercase">{profile.currentLevel}</div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Award className="h-5 w-5 text-indigo-400" />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: "Detected Gaps", val: profile.gaps.length, icon: TrendingDown, color: "text-indigo-400", sub: "Closing Potential" },
             { label: "Mission Critical", val: criticalGaps.length, icon: AlertCircle, color: criticalGaps.length > 0 ? "text-rose-500 animate-pulse" : "text-gray-700", sub: "Immediate Focus" },
             { label: "Baseline State", val: profile.currentLevel, isLevel: true, icon: Fingerprint, color: "text-indigo-400", sub: "Current Mastery" },
             { label: "Target State", val: profile.targetLevel, isLevel: true, icon: Target, color: "text-purple-400", sub: "Maturity Objective" }
           ].map((stat, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
               <Card className={`h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/30 transition-all ${i === 1 && criticalGaps.length > 0 ? 'border-rose-500/30 shadow-[0_20px_40px_-10px_rgba(244,63,94,0.1)]' : ''}`}>
                 <CardContent className="p-8">
                   <div className="flex items-start justify-between mb-8">
                      <div className="h-12 w-12 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                         <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">{stat.label}</span>
                   </div>
                   <div className={`font-black text-white italic tracking-tighter leading-none ${stat.isLevel ? 'text-2xl uppercase' : 'text-5xl tabular-nums'}`}>
                     {stat.val || 0}
                   </div>
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 mt-6 border-t border-gray-800 pt-4">{stat.sub}</div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-12 xl:col-span-7 space-y-8">
            <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-2 italic">Identified Friction points</div>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
              {profile.gaps.map((gap: SkillGap, idx: number) => (
                <motion.div
                  key={gap.skill}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className={`group cursor-pointer bg-gray-900/40 border-[1.5px] rounded-4xl overflow-hidden transition-all duration-300 ${
                      selectedGap?.skill === gap.skill
                        ? 'border-indigo-500/60 bg-indigo-500/05 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)]'
                        : 'border-gray-900 hover:border-gray-800'
                    }`}
                    onClick={() => setSelectedGap(gap)}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between gap-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-4">
                             <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic">{gap.skill}</h3>
                             <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${SeverityConfig[gap.severity as keyof typeof SeverityConfig].bg} ${SeverityConfig[gap.severity as keyof typeof SeverityConfig].text} ${SeverityConfig[gap.severity as keyof typeof SeverityConfig].border}`}>
                                {SeverityConfig[gap.severity as keyof typeof SeverityConfig].label}
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8 border-t border-gray-800/50 pt-6">
                             <div className="space-y-3">
                                <div className="flex items-center justify-between text-[9px] font-black text-gray-700 uppercase tracking-widest italic">
                                   <span>Mastery Synthesis</span>
                                   <span className="text-white">{gap.currentProficiency}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-gray-800 shadow-inner">
                                   <div className="h-full bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.3)]" style={{ width: `${gap.currentProficiency}%` }} />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <div className="flex items-center justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest italic">
                                   <span>Institutional Threshold</span>
                                   <span className="text-indigo-400">{gap.requiredProficiency}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-gray-800 shadow-inner">
                                   <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${gap.requiredProficiency}%` }} />
                                </div>
                             </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 bg-black/40 p-4 rounded-2xl border border-gray-800 shadow-inner group-hover:border-indigo-500/20 transition-all shrink-0">
                           <div className="text-2xl font-black text-indigo-400 italic tracking-tighter tabular-nums">-{gap.requiredProficiency - gap.currentProficiency}%</div>
                           <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest">Variance</div>
                           <ChevronRight className={`h-5 w-5 text-gray-800 mt-2 transition-transform ${selectedGap?.skill === gap.skill ? 'translate-x-1 text-indigo-400' : ''}`} />
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
              {selectedGap ? (
                <motion.div
                  key={selectedGap.skill}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-gray-900/60 border border-indigo-500/20 rounded-4xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative">
                    <div className="h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-rose-500" />
                    <CardContent className="p-10 space-y-12">
                      <header>
                        <div className="flex items-center justify-between mb-8">
                           <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] uppercase font-bold text-indigo-400 tracking-widest">Remediation Roadmap</div>
                           <ShieldCheck className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic leading-none">{selectedGap.skill}</h2>
                        <div className="p-6 rounded-4xl bg-black border border-gray-800 relative overflow-hidden group/desc">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/40" />
                           <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed">
                             " {selectedGap.reason} "
                           </p>
                        </div>
                      </header>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-8 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                            <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest flex items-center gap-3">
                               <Clock className="h-3 w-3" />
                               Commitment
                            </div>
                            <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{selectedGap.estimatedTimeToFix}</div>
                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Est. Hours</div>
                         </div>
                         <div className="p-8 rounded-4xl bg-black/40 border border-gray-800 shadow-inner flex flex-col items-center text-center gap-2">
                            <div className="text-[9px] uppercase font-black text-gray-700 tracking-widest flex items-center gap-3">
                               <TrendingUp className="h-3 w-3" />
                               Proficiency
                            </div>
                            <div className="text-4xl font-black text-indigo-400 italic tracking-tighter tabular-nums">{selectedGap.requiredProficiency}</div>
                            <div className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">% Target</div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="text-[10px] uppercase font-black text-gray-700 tracking-[0.3em] px-1 italic">Accelerated Mastery Path</div>
                         <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedGap.suggestedResources?.map((resource: string, i: number) => (
                              <div key={i} className="group/resource flex items-center justify-between p-5 rounded-2xl bg-black border border-gray-800 hover:border-indigo-500/30 transition-all duration-300">
                                 <div className="flex items-center gap-5">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-500/05 border border-indigo-500/10 flex items-center justify-center">
                                       <BookOpen className="h-5 w-5 text-indigo-400 group-hover/resource:scale-110 transition-transform" />
                                    </div>
                                    <span className="text-[11px] font-black text-gray-500 group-hover/resource:text-white transition-colors uppercase italic tracking-tight">{resource}</span>
                                 </div>
                                 <ChevronRight className="h-4 w-4 text-gray-800 group-hover/resource:text-indigo-400 transition-transform group-hover/resource:translate-x-1" />
                              </div>
                            ))}
                         </div>
                      </div>

                      <Button className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                         <Zap className="h-4 w-4" />
                         Initialize Remediation
                         <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-[750px] flex flex-col items-center justify-center bg-gray-900/10 border-2 border-dashed border-gray-900 rounded-4xl opacity-40 space-y-8">
                   <div className="h-20 w-20 rounded-3xl bg-black border border-gray-800 flex items-center justify-center">
                      <Target className="h-8 w-8 text-gray-700" />
                   </div>
                   <p className="text-gray-700 font-black uppercase tracking-[0.4em] text-xs px-4 text-center">Awaiting competency node selection</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-12 md:p-16 rounded-4xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col md:flex-row items-center gap-12 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.15)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
              <Activity className="h-10 w-10 text-indigo-400" />
           </div>
           <div className="flex-1 space-y-4 text-center md:text-left">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Performance Advisory</h4>
              <p className="text-gray-400 font-medium italic text-lg leading-relaxed">
                 Synthesized variance analysis indicates that closing mission-critical gaps will increase contribution throughput by <span className="text-white font-bold">42%</span>. Alignment with target state projected in 3.5 weeks.
              </p>
           </div>
        </div>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Competency Engine Active
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                 <Binary className="h-3 w-3 text-gray-800" />
                 Institutional Profile v1.2.0
              </div>
              <div>Institutional Resolution: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
           </div>
        </footer>
      </div>
    </div>
  );
}
