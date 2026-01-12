import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Github, 
  MapPin, 
  Link as LinkIcon, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Save,
  Code2,
  Users,
  GitBranch,
  Star
} from "lucide-react"

interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
  following: number
  bio: string | null
  location: string | null
  blog: string | null
  created_at: string
}

export default function Profile() {
  const { user, logout } = useAuth()
  
  const [githubUsername, setGithubUsername] = useState(() => {
    if (typeof window !== "undefined" && user?.uid) {
      return localStorage.getItem(`github_username_${user.uid}`) || ""
    }
    return ""
  })

  const [savedGithubUsername, setSavedGithubUsername] = useState(() => {
    if (typeof window !== "undefined" && user?.uid) {
      return localStorage.getItem(`github_username_${user.uid}`) || ""
    }
    return ""
  })

  useEffect(() => {
    if (user?.uid) {
       // Using setTimeout to prevent synchronous setState warning
       const timer = setTimeout(() => {
         const saved = localStorage.getItem(`github_username_${user.uid}`) || ""
         setGithubUsername(saved)
         setSavedGithubUsername(saved)
       }, 0)
       return () => clearTimeout(timer)
    }
  }, [user?.uid])

  const [githubData, setGithubData] = useState<GitHubUser | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "loading" | "verified" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const verifyGitHubUsername = useCallback(async (username: string) => {
    if (!username.trim()) {
      setVerificationStatus("idle")
      setGithubData(null)
      return
    }

    setVerificationStatus("loading")
    setErrorMessage("")

    try {
      const response = await fetch(`https://api.github.com/users/${username.trim()}`)
      
      if (response.ok) {
        const data: GitHubUser = await response.json()
        setGithubData(data)
        setVerificationStatus("verified")
      } else if (response.status === 404) {
        setVerificationStatus("error")
        setErrorMessage("GitHub user not found")
        setGithubData(null)
      } else if (response.status === 403) {
        setVerificationStatus("error")
        setErrorMessage("Rate limit exceeded. Try again later.")
        setGithubData(null)
      } else {
        setVerificationStatus("error")
        setErrorMessage("Failed to verify GitHub username")
        setGithubData(null)
      }
    } catch {
      setVerificationStatus("error")
      setErrorMessage("Network error. Please try again.")
      setGithubData(null)
    }
  }, [])

  useEffect(() => {
    if (savedGithubUsername) {
      // Small delay to prevent synchronous setState warning in some environments
      const timer = setTimeout(() => {
        verifyGitHubUsername(savedGithubUsername)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [savedGithubUsername, verifyGitHubUsername])

  const handleSaveGitHub = () => {
    if (verificationStatus === "verified" && user?.uid) {
      localStorage.setItem(`github_username_${user.uid}`, githubUsername.trim())
      setSavedGithubUsername(githubUsername.trim())
    }
  }

  const stats = [
    { 
      label: "Repositories", 
      value: githubData?.public_repos?.toString() || "0", 
      icon: Code2,
      color: "from-indigo-500 to-purple-500"
    },
    { 
      label: "Followers", 
      value: githubData?.followers?.toString() || "0", 
      icon: Users,
      color: "from-purple-500 to-pink-500"
    },
    { 
      label: "Following", 
      value: githubData?.following?.toString() || "0", 
      icon: GitBranch,
      color: "from-pink-500 to-rose-500"
    },
    { 
      label: "Since", 
      value: githubData?.created_at 
        ? new Date(githubData.created_at).getFullYear().toString() 
        : "N/A", 
      icon: Star,
      color: "from-amber-500 to-orange-500"
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/identity-matrix
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Identity <span className="not-italic text-gray-500">Node</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Sequential access for node: <span className="text-gray-300 not-italic">{user?.email || "developer@codeflow.sh"}</span>
              </p>
           </div>
           
           <Button 
             variant="outline" 
             className="h-14 px-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 rounded-2xl font-black uppercase tracking-widest text-[10px]" 
             onClick={logout}
           >
             <LogOut className="mr-2 h-4 w-4" />
             Terminate Session
           </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
              <CardContent className="p-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                       <Github className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-white uppercase tracking-tight italic">GitHub Synthesis</h2>
                       <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Institutional Artifact Binding</p>
                    </div>
                  </div>
                  {verificationStatus === "verified" && (
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
                      Verified Sync
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Input
                      placeholder="Enter GitHub ID"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && verifyGitHubUsername(githubUsername)}
                      className="bg-black/40 border-gray-800 focus:border-indigo-500/40 text-white h-16 rounded-2xl px-6 italic font-medium group-hover:border-gray-700 transition-all"
                    />
                    <AnimatePresence mode="wait">
                      {verificationStatus === "loading" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                        </div>
                      )}
                      {verificationStatus === "verified" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => verifyGitHubUsername(githubUsername)}
                      disabled={verificationStatus === "loading" || !githubUsername.trim()}
                      className="h-16 px-8 border-gray-800 hover:border-indigo-500/40 hover:bg-white/2 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                      Verify
                    </Button>
                    
                    <Button 
                      onClick={handleSaveGitHub}
                      disabled={verificationStatus !== "verified" || githubUsername === savedGithubUsername}
                      className="h-16 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Commit
                    </Button>
                  </div>
                </div>

                {verificationStatus === "error" && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl p-6 italic"
                  >
                    <XCircle className="h-5 w-5 shrink-0" />
                    {errorMessage}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {verificationStatus === "verified" && githubData && (
                    <motion.div
                      key="github-data"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 rounded-4xl bg-black/40 border border-gray-800 relative overflow-hidden group shadow-inner"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/05 rounded-full blur-[80px] pointer-events-none" />
                      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                        <img 
                          src={githubData.avatar_url} 
                          alt={githubData.login}
                          className="h-32 w-32 rounded-3xl border-2 border-indigo-500/20 shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="flex-1 text-center md:text-left space-y-4">
                          <div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                              {githubData.name || githubData.login}
                            </h3>
                            <a 
                              href={githubData.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 flex items-center justify-center md:justify-start gap-2 transition-colors font-black uppercase tracking-widest text-[10px] mt-2"
                            >
                              @{githubData.login}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {githubData.bio && (
                            <p className="text-gray-400 italic text-lg leading-relaxed max-w-2xl font-medium">
                              "{githubData.bio}"
                            </p>
                          )}
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                            {githubData.location && (
                              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                <MapPin className="h-3 w-3 text-indigo-400" />
                                {githubData.location}
                              </span>
                            )}
                            {githubData.blog && (
                              <a 
                                href={githubData.blog.startsWith('http') ? githubData.blog : `https://${githubData.blog}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-indigo-400 transition-colors"
                              >
                                <LinkIcon className="h-3 w-3 text-indigo-400" />
                                Resource Grid
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden hover:border-indigo-500/30 transition-all shadow-xl group">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="h-10 w-10 rounded-xl bg-black border border-gray-800 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
                         <stat.icon className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-white italic tracking-tighter tabular-nums leading-none">
                          {stat.value}
                        </div>
                        <div className="text-[9px] font-black uppercase text-gray-700 tracking-widest italic">
                          {stat.label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-800 text-center">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Node Telemetry</h2>
              </div>
              <CardContent className="p-10 space-y-10">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                    <div className="h-24 w-24 rounded-3xl border-2 border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center overflow-hidden relative z-10">
                      {githubData?.avatar_url ? (
                        <img 
                          src={githubData.avatar_url} 
                          alt="Avatar" 
                          className="h-full w-full object-cover grayscale" 
                        />
                      ) : (
                        <span className="text-4xl font-black text-indigo-400 italic">
                          {user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
                      {githubData?.name || user?.displayName || "Developer"}
                    </div>
                    <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest font-mono">
                      {user?.email}
                    </div>
                  </div>
                </div>
                
                <div className="pt-10 border-t border-gray-800 space-y-6">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Network Status</span>
                     <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">ACTIVE</span>
                     </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Node Plan</span>
                     <span className="text-[10px] text-white font-black uppercase tracking-widest">PRO TIER</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Instance ID</span>
                     <code className="text-[8px] bg-black/40 border border-gray-800 px-3 py-1 rounded-lg text-gray-500 font-mono tracking-tighter">
                       {user?.uid?.substring(0, 16)}
                     </code>
                   </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-4xl bg-linear-to-br from-indigo-600 to-indigo-900 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] pointer-events-none" />
               <div className="relative z-10 space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Operational Readiness</div>
                    <h4 className="text-2xl font-black text-white italic tracking-tighter leading-none">94.2% SYNC</h4>
                  </div>
                  <p className="text-[11px] text-white/50 font-medium italic leading-relaxed">
                    Identity matrix verified across institutional clusters. Ready for discovery scan.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Identity Guard Active
         </div>
         <div>Institutional Resolution: 2026</div>
      </footer>
    </div>
  )
}
