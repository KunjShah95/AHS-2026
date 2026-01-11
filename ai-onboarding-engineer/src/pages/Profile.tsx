/*
BILLION: A profile that feels like an RPG character sheet for an engineer.
DIRECTION: Data-Heavy / Personal / Clean
SIGNATURE: Stats Dashboard
*/

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Github, MapPin, Link as LinkIcon, Shield, Clock, Code2, Award, LogOut, CheckCircle2, XCircle, Loader2, ExternalLink, Save } from "lucide-react"

interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
  bio: string | null
}

export default function Profile() {
  const { user, logout } = useAuth()
  
  // GitHub verification state
  const [githubUsername, setGithubUsername] = useState("")
  const [savedGithubUsername, setSavedGithubUsername] = useState("")
  const [githubData, setGithubData] = useState<GitHubUser | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "loading" | "verified" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Load saved GitHub username from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`github_username_${user?.uid}`)
    if (saved) {
      setSavedGithubUsername(saved)
      setGithubUsername(saved)
      verifyGitHubUsername(saved)
    }
  }, [user?.uid])

  // Verify GitHub username by fetching from GitHub API
  const verifyGitHubUsername = async (username: string) => {
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
  }

  // Save GitHub username
  const handleSaveGitHub = () => {
    if (verificationStatus === "verified" && user?.uid) {
      localStorage.setItem(`github_username_${user.uid}`, githubUsername.trim())
      setSavedGithubUsername(githubUsername.trim())
    }
  }

  // Mock Data (Replace with real DB fetch later)
  const stats = [
    { label: "Repos Analyzed", value: "12", icon: Code2 },
    { label: "Context Acquired", value: "85%", icon: Shield },
    { label: "Hours Saved", value: "142", icon: Clock },
    { label: "Current Level", value: "L4", icon: Award },
  ]

  const recentHistory = [
    { repo: "user/frontend-v2", date: "2 hours ago", status: "Completed" },
    { repo: "org/backend-api", date: "1 day ago", status: "Completed" },
    { repo: "org/legacy-auth", date: "3 days ago", status: "Partial" },
  ]

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"
        >
           <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-linear-to-br from-primary to-blue-600 p-[2px]">
                   <div className="h-full w-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                      {githubData?.avatar_url ? (
                        <img src={githubData.avatar_url} alt="GitHub Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                   </div>
                </div>
                <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-background ${
                  verificationStatus === "verified" ? "bg-green-500" : "bg-muted"
                }`} />
              </div>
              
              <div>
                 <h1 className="text-3xl font-bold">{githubData?.name || user?.displayName || "Engineer"}</h1>
                 <p className="text-muted-foreground font-mono text-sm">{user?.email}</p>
                 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground/80">
                    {savedGithubUsername && verificationStatus === "verified" ? (
                      <a 
                        href={`https://github.com/${savedGithubUsername}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Github className="h-3 w-3" /> @{savedGithubUsername}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Github className="h-3 w-3" /> Not linked
                      </span>
                    )}
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> San Francisco, CA</span>
                    <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> portfolio.dev</span>
                 </div>
              </div>
           </div>

           <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sign Out
           </Button>
        </motion.div>

        {/* GitHub Integration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Github className="h-5 w-5" /> 
                GitHub Integration
                {verificationStatus === "verified" && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full border border-green-500/30">
                    Verified
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Link your GitHub account to enable repository analysis and track your onboarding progress.
              </p>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter your GitHub username"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="bg-black/40 border-white/10 pr-10"
                  />
                  {verificationStatus === "loading" && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {verificationStatus === "verified" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {verificationStatus === "error" && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => verifyGitHubUsername(githubUsername)}
                  disabled={verificationStatus === "loading" || !githubUsername.trim()}
                  className="border-white/10"
                >
                  Verify
                </Button>
                
                <Button 
                  onClick={handleSaveGitHub}
                  disabled={verificationStatus !== "verified" || githubUsername === savedGithubUsername}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>

              {verificationStatus === "error" && errorMessage && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> {errorMessage}
                </p>
              )}

              {/* GitHub User Preview */}
              {verificationStatus === "verified" && githubData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-4 rounded-lg bg-black/40 border border-green-500/20"
                >
                  <div className="flex items-center gap-4">
                    <img 
                      src={githubData.avatar_url} 
                      alt={githubData.login}
                      className="h-16 w-16 rounded-full border-2 border-green-500/30"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{githubData.name || githubData.login}</div>
                      <a 
                        href={githubData.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        @{githubData.login} <ExternalLink className="h-3 w-3" />
                      </a>
                      {githubData.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{githubData.bio}</p>
                      )}
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold font-mono">{githubData.public_repos}</div>
                        <div className="text-xs text-muted-foreground">Repos</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold font-mono">{githubData.followers}</div>
                        <div className="text-xs text-muted-foreground">Followers</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {stats.map((stat, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 + 0.2 }}
             >
               <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                 <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                       <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold font-mono">{stat.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                 <Clock className="h-5 w-5 text-primary" /> Recent Onboarding History
              </h2>
              <div className="space-y-4">
                 {recentHistory.map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-black/40 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded bg-white/5 flex items-center justify-center">
                            <Code2 className="h-5 w-5 text-muted-foreground" />
                         </div>
                         <div>
                            <div className="font-medium">{item.repo}</div>
                            <div className="text-xs text-muted-foreground">{item.date}</div>
                         </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full border ${
                        item.status === "Completed" 
                          ? "border-green-500/30 text-green-500 bg-green-500/10" 
                          : "border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
                      }`}>
                         {item.status}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                 <Shield className="h-5 w-5 text-primary" /> Active Plans
              </h2>
              <Card className="bg-linear-to-br from-primary/20 to-card border-primary/20">
                 <CardHeader>
                    <CardTitle className="text-lg">Pro Plan</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                       Your plan renews on <span className="text-foreground font-medium">Feb 12, 2026</span>.
                    </div>
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between text-xs">
                          <span>Usage</span>
                          <span>85%</span>
                       </div>
                       <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[85%]" />
                       </div>
                    </div>
                    <Button className="w-full text-xs" variant="secondary">Manage Billing</Button>
                 </CardContent>
              </Card>
           </div>
        </div>

      </div>
    </div>
  )
}
