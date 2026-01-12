import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Loader2, 
  Code2, 
  GitBranch, 
  Sparkles, 
  Terminal, 
  Activity, 
  Globe, 
  Github,
  Binary,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Fingerprint
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { saveRepoAnalysis, type SavedAnalysis } from "@/lib/db"
import { useRepository } from "@/hooks/useRepository"

export default function RepoAnalysis() {
  const [repoUrl, setRepoUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectRepository, refreshRepositories } = useRepository()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return
    
    if (!user) {
        navigate("/login")
        return
    }

    setAnalyzing(true)
    setError("")
    
    try {
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
        const repoPath = `repos/${user.uid}/${repoName}`;

        const response = await api.post<Record<string, unknown>>('/ingestion/process', {
            repo_path: repoPath,
            github_url: repoUrl
        });

        let analysisId: string;
        try {
          analysisId = await saveRepoAnalysis(user.uid, repoUrl, response);
        } catch (firestoreError) {
          console.warn("Firestore save failed, but continuing with analysis:", firestoreError);
          analysisId = `temp_${Date.now()}`;
        }
        
        try {
          await refreshRepositories();
        } catch (refreshError) {
          console.warn("Failed to refresh repositories:", refreshError);
        }
        
        const newAnalysis: SavedAnalysis = {
          id: analysisId,
          userId: user.uid,
          repoUrl,
          repoName,
          data: response,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          status: 'completed',
          isFavorite: false,
        };
        
        try {
          selectRepository(newAnalysis);
        } catch (contextError) {
          console.warn("Failed to update context:", contextError);
        }
        
        navigate("/roadmap", { state: { analysisData: response, repoUrl: repoUrl } })

    } catch (err: unknown) {
        console.error("Analysis failed:", err);
        
        let errorMessage = "Failed to analyze repository. Please check the URL and try again.";
        
        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch')) {
            errorMessage = "Backend API is not responding. Make sure the backend server is running on http://localhost:8000";
          } else if (err.message.includes('403') || err.message.includes('401')) {
            errorMessage = "Authentication failed. Please sign in again.";
          } else if (err.message.includes('404')) {
            errorMessage = "Repository not found. Please check the GitHub URL.";
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
    } finally {
        setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 flex flex-col items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-purple-500/05 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-4xl space-y-16 pb-32"
      >
        <header className="text-center space-y-8">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em] italic"
           >
              /archive/initialization-phase
           </motion.div>
           
           <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight italic">
                 Clone <span className="not-italic text-gray-500">&</span> <br /> Decode
              </h1>
              <p className="text-xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
                 Provision a neural gateway to your GitHub repository and synthesize its structural DNA in real-time.
              </p>
           </div>
        </header>

        <Card className="bg-gray-900/40 border border-gray-800 rounded-5xl overflow-hidden shadow-[0_40px_120px_-20px_rgba(79,70,229,0.2)] backdrop-blur-3xl">
          <CardContent className="p-12 md:p-16">
            <form onSubmit={handleAnalyze} className="space-y-10">
              <div className="relative group">
                <div className="absolute inset-x-0 -bottom-10 h-32 bg-indigo-500/10 blur-[80px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row gap-6">
                   <div className="flex-1 relative">
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-center group-focus-within:border-indigo-500/40 transition-colors">
                        <Globe className="h-4 w-4 text-gray-700 group-focus-within:text-indigo-400" />
                      </div>
                      <Input 
                        placeholder="https://github.com/organization/repository" 
                        className="h-24 pl-24 pr-10 bg-black/40 border-gray-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/40 text-white placeholder:text-gray-800 text-xl font-black italic rounded-3xl shadow-inner transition-all uppercase tracking-tight"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        disabled={analyzing}
                      />
                   </div>
                   <Button 
                    type="submit" 
                    className="h-24 px-12 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-3xl hover:bg-gray-200 transition-all active:scale-95 disabled:bg-gray-900 group/btn shadow-2xl shrink-0 flex items-center gap-6 italic"
                    disabled={analyzing || !repoUrl}
                   >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        Synchronizing
                      </>
                    ) : (
                      <>
                        <Github className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                        Engage Scan
                        <ArrowRight className="h-5 w-5 text-black/40 group-hover/btn:translate-x-1 group-hover/btn:text-black transition-all" />
                      </>
                    )}
                   </Button>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-3xl flex items-center gap-6 relative overflow-hidden">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/40" />
                       <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
                          <Activity className="h-6 w-6 text-rose-500" />
                       </div>
                       <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] italic leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-12 border-t border-gray-800/30">
                <div className="flex items-center justify-between px-2 mb-10">
                   <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] italic">Institutional Protocol Support</div>
                   <div className="flex items-center gap-6 opacity-40">
                      <ShieldCheck className="h-4 w-4 text-gray-600" />
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Encrypted Engine</div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: "TypeScript", icon: Code2, color: "text-indigo-400", desc: "Static Analysis" },
                    { name: "Python", icon: Sparkles, color: "text-purple-400", desc: "ML Processing" },
                    { name: "Node.js", icon: Terminal, color: "text-emerald-400", desc: "Logic Extraction" },
                    { name: "Infrastructure", icon: GitBranch, color: "text-amber-400", desc: "Docker / K8s" }
                  ].map((tech) => (
                    <div
                      key={tech.name}
                      className="group flex items-center gap-6 p-6 rounded-3xl bg-black/40 border border-gray-800 hover:border-indigo-500/20 transition-all duration-500"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0">
                         <tech.icon className={`h-6 w-6 ${tech.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] italic">{tech.name}</div>
                        <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">{tech.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-gray-900">
          {[
            { icon: Zap, label: "Real-time Synthesis", value: "44.2 Seconds" },
            { icon: Cpu, label: "Context density", value: "8.4M Tokens" },
            { icon: Binary, label: "Neural Nodes", value: "1,402 Layers" }
          ].map((stat) => (
            <div key={stat.label} className="text-center md:text-left space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-4 text-gray-700 font-black uppercase tracking-[0.4em] text-[10px] italic">
                <stat.icon className="h-4 w-4 opacity-40" />
                {stat.label}
              </div>
              <div className="text-3xl font-black text-white italic tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            Ingestion Engine Active
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <Fingerprint className="h-3.5 w-3.5" />
               Validation Ready
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
