/*
REDESIGNED PROFILE PAGE
A premium RPG-style character sheet for engineers
Features: Glassmorphic design, gradient accents, skill progression, achievements
*/

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Github, 
  MapPin, 
  Link as LinkIcon, 
  Shield, 
  Clock, 
  Code2, 
  Award, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Save,
  Star,
  Target,
  Zap,
  TrendingUp,
  Users,
  GitBranch
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

interface SkillProgress {
  name: string
  level: number
  maxLevel: number
  xp: number
  maxXp: number
  color: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: typeof Award
  unlocked: boolean
  date?: string
}

export default function Profile() {
  const { user, logout } = useAuth()
  
  // GitHub state - properly initialized to avoid cascading renders
  const [githubUsername, setGithubUsername] = useState("")
  const [savedGithubUsername, setSavedGithubUsername] = useState("")
  const [githubData, setGithubData] = useState<GitHubUser | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "loading" | "verified" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // Load saved GitHub username on mount
  useEffect(() => {
    if (user?.uid) {
      const saved = localStorage.getItem(`github_username_${user.uid}`)
      if (saved) {
        setGithubUsername(saved)
        setSavedGithubUsername(saved)
      }
    }
  }, [user?.uid])

  // Verify GitHub username function
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

  // Auto-verify saved username on mount
  useEffect(() => {
    if (savedGithubUsername) {
      verifyGitHubUsername(savedGithubUsername)
    }
  }, []) // Only run once on mount

  // Save GitHub username
  const handleSaveGitHub = () => {
    if (verificationStatus === "verified" && user?.uid) {
      localStorage.setItem(`github_username_${user.uid}`, githubUsername.trim())
      setSavedGithubUsername(githubUsername.trim())
    }
  }

  // Mock skills data - replace with real data from backend
  const skills: SkillProgress[] = [
    { name: "React Mastery", level: 7, maxLevel: 10, xp: 4200, maxXp: 5000, color: "from-blue-500 to-cyan-500" },
    { name: "Code Review", level: 5, maxLevel: 10, xp: 2800, maxXp: 3500, color: "from-purple-500 to-pink-500" },
    { name: "Architecture", level: 6, maxLevel: 10, xp: 3100, maxXp: 4000, color: "from-orange-500 to-red-500" },
    { name: "Testing", level: 4, maxLevel: 10, xp: 1500, maxXp: 2500, color: "from-green-500 to-emerald-500" },
  ]

  // Mock achievements - replace with real data
  const achievements: Achievement[] = [
    { id: "1", title: "First Steps", description: "Completed first onboarding", icon: Target, unlocked: true, date: "2024-12-15" },
    { id: "2", title: "Code Explorer", description: "Analyzed 10 repositories", icon: Code2, unlocked: true, date: "2024-12-20" },
    { id: "3", title: "Speed Demon", description: "Completed analysis in under 5 min", icon: Zap, unlocked: true, date: "2025-01-05" },
    { id: "4", title: "Team Player", description: "Invited 5 team members", icon: Users, unlocked: false },
    { id: "5", title: "Branch Master", description: "Analyzed 50 different branches", icon: GitBranch, unlocked: false },
    { id: "6", title: "Legendary", description: "Reach level 10 in all skills", icon: Star, unlocked: false },
  ]

  // Main stats
  const stats = [
    { label: "Repos Analyzed", value: githubData?.public_repos || "12", icon: Code2, color: "text-blue-400" },
    { label: "GitHub Followers", value: githubData?.followers || "0", icon: Users, color: "text-purple-400" },
    { label: "Hours Saved", value: "142", icon: Clock, color: "text-green-400" },
    { label: "Current Level", value: "L7", icon: Award, color: "text-orange-400" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
        >
          <div className="flex items-center gap-6">
            {/* Avatar with level ring */}
            <div className="relative">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Level ring */}
                <svg className="absolute inset-0 -m-2" width="112" height="112">
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeDasharray={`${(85 / 100) * 326.73} 326.73`}
                    strokeLinecap="round"
                    transform="rotate(-90 56 56)"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[3px]">
                  <div className="h-full w-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
                    {githubData?.avatar_url ? (
                      <img src={githubData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Status badge */}
                <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-4 border-gray-900 flex items-center justify-center ${
                  verificationStatus === "verified" ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gray-700"
                }`}>
                  {verificationStatus === "verified" && (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </div>
              </motion.div>
              
              {/* XP Progress */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="text-xs font-mono text-gray-400">85% to L8</div>
              </div>
            </div>
            
            <div className="mt-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {githubData?.name || user?.displayName || "Engineer"}
              </h1>
              <p className="text-gray-400 font-mono text-sm mt-1">{user?.email}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                {savedGithubUsername && verificationStatus === "verified" ? (
                  <a 
                    href={`https://github.com/${savedGithubUsername}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span>@{savedGithubUsername}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-yellow-500">
                    <Github className="h-4 w-4" />
                    <span>Not linked</span>
                  </span>
                )}
                {githubData?.location && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <MapPin className="h-4 w-4" />
                    {githubData.location}
                  </span>
                )}
                {githubData?.blog && (
                  <a 
                    href={githubData.blog.startsWith('http') ? githubData.blog : `https://${githubData.blog}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {githubData.blog.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 gap-2 backdrop-blur-sm" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 group">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color.replace('text-', 'from-')} to-transparent opacity-20 group-hover:opacity-30 transition-opacity`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold font-mono bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - GitHub Integration & Skills */}
          <div className="lg:col-span-2 space-y-6">
            {/* GitHub Integration */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-gradient-to-r from-gray-900/80 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Github className="h-5 w-5 text-purple-400" />
                    </div>
                    <span>GitHub Integration</span>
                    {verificationStatus === "verified" && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30 font-semibold">
                        ✓ Verified
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-gray-400">
                    Link your GitHub account to unlock advanced analytics, contribution tracking, and personalized insights.
                  </p>
                  
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter your GitHub username"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && verifyGitHubUsername(githubUsername)}
                        className="bg-black/40 border-white/10 focus:border-purple-500/50 pr-10 transition-all"
                      />
                      <AnimatePresence mode="wait">
                        {verificationStatus === "loading" && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                          </motion.div>
                        )}
                        {verificationStatus === "verified" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          </motion.div>
                        )}
                        {verificationStatus === "error" && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <XCircle className="h-4 w-4 text-red-400" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => verifyGitHubUsername(githubUsername)}
                      disabled={verificationStatus === "loading" || !githubUsername.trim()}
                      className="border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10"
                    >
                      Verify
                    </Button>
                    
                    <Button 
                      onClick={handleSaveGitHub}
                      disabled={verificationStatus !== "verified" || githubUsername === savedGithubUsername}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>

                  {verificationStatus === "error" && errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      <XCircle className="h-4 w-4" />
                      {errorMessage}
                    </motion.div>
                  )}

                  {/* GitHub User Preview */}
                  <AnimatePresence>
                    {verificationStatus === "verified" && githubData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                          <div className="flex items-center gap-4">
                            <img 
                              src={githubData.avatar_url} 
                              alt={githubData.login}
                              className="h-16 w-16 rounded-full border-2 border-green-500/30 ring-4 ring-green-500/10"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-white">
                                {githubData.name || githubData.login}
                              </div>
                              <a 
                                href={githubData.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                              >
                                @{githubData.login}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {githubData.bio && (
                                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{githubData.bio}</p>
                              )}
                            </div>
                            <div className="flex gap-6 text-center">
                              <div>
                                <div className="text-xl font-bold font-mono text-white">{githubData.public_repos}</div>
                                <div className="text-xs text-gray-400">Repos</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold font-mono text-white">{githubData.followers}</div>
                                <div className="text-xs text-gray-400">Followers</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold font-mono text-white">{githubData.following}</div>
                                <div className="text-xs text-gray-400">Following</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Skills Progress */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-xl">
                <CardHeader className="border-b border-white/5 bg-gradient-to-r from-gray-900/80 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                    </div>
                    <span>Skill Progression</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {skills.map((skill, i) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">{skill.name}</span>
                        <span className="text-xs font-mono text-gray-400">
                          Level {skill.level}/{skill.maxLevel}
                        </span>
                      </div>
                      <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(skill.xp / skill.maxXp) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className={`h-full bg-gradient-to-r ${skill.color} rounded-full relative`}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 font-mono">
                        <span>{skill.xp} XP</span>
                        <span>{skill.maxXp} XP</span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Achievements & Activity */}
          <div className="space-y-6">
            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-xl">
                <CardHeader className="border-b border-white/5 bg-gradient-to-r from-gray-900/80 to-transparent">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                      <Award className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span>Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {achievements.map((achievement, i) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        achievement.unlocked
                          ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/30 hover:border-yellow-500/50"
                          : "bg-black/20 border-white/5 hover:border-white/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          achievement.unlocked 
                            ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20" 
                            : "bg-gray-800/40"
                        }`}>
                          <achievement.icon className={`h-5 w-5 ${
                            achievement.unlocked ? "text-yellow-400" : "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white flex items-center gap-2">
                            {achievement.title}
                            {achievement.unlocked && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {achievement.description}
                          </div>
                          {achievement.unlocked && achievement.date && (
                            <div className="text-xs text-gray-500 mt-2 font-mono">
                              Unlocked: {new Date(achievement.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Plan Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/20 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-50" />
                <CardHeader className="relative border-b border-purple-500/20">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                      <Shield className="h-5 w-5 text-purple-300" />
                    </div>
                    <span>Pro Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 relative">
                  <div className="text-sm text-gray-300">
                    Your plan renews on <span className="text-white font-semibold">Feb 12, 2026</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Monthly Usage</span>
                      <span className="font-mono">85%</span>
                    </div>
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 text-sm font-semibold">
                    Manage Billing
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
