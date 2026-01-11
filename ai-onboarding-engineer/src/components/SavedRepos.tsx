import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  GitBranch, 
  Star, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Code2, 
  Loader2,
  FolderGit2,
  Sparkles,
  Zap
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { 
  getAllUserAnalyses, 
  deleteAnalysis, 
  toggleFavorite,
  updateLastAccessed,
  type SavedAnalysis 
} from "@/lib/db"

interface SavedReposProps {
  onSelectRepo?: (analysis: SavedAnalysis) => void
  compact?: boolean
}

export default function SavedRepos({ onSelectRepo, compact = false }: SavedReposProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [repos, setRepos] = useState<SavedAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRepos = async () => {
      if (!user) return
      
      try {
        const analyses = await getAllUserAnalyses(user.uid)
        setRepos(analyses)
      } catch (error) {
        console.error("Error fetching repos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [user])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this analysis?")) return
    
    setDeletingId(id)
    try {
      await deleteAnalysis(id)
      setRepos(repos.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error deleting analysis:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleFavorite = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleFavorite(id, !currentStatus)
      setRepos(repos.map(r => 
        r.id === id ? { ...r, isFavorite: !currentStatus } : r
      ))
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const handleSelectRepo = async (analysis: SavedAnalysis) => {
    try {
      await updateLastAccessed(analysis.id)
      if (onSelectRepo) {
        onSelectRepo(analysis)
      } else {
        navigate("/roadmap", { state: { analysisData: analysis.data, repoUrl: analysis.repoUrl } })
      }
    } catch (error) {
      console.error("Error updating last accessed:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
    })
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'advanced': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-muted-foreground bg-muted/10 border-muted/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <Card className="border-dashed border-white/10 bg-card/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderGit2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No repositories yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
            Analyze your first repository to get started
          </p>
          <Button onClick={() => navigate("/analysis")} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Analyze Repository
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {repos.slice(0, 5).map((repo) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-white/5 hover:border-primary/30 cursor-pointer transition-all group"
            onClick={() => handleSelectRepo(repo)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{repo.repoName || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {repo.metadata?.owner || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {repo.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
        {repos.length > 5 && (
          <Button variant="ghost" className="w-full text-sm" onClick={() => navigate("/repositories")}>
            View all {repos.length} repositories
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {repos.map((repo, index) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="relative overflow-hidden border-white/10 bg-card/60 hover:border-primary/30 cursor-pointer transition-all group h-full"
              onClick={() => handleSelectRepo(repo)}
            >
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <GitBranch className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        {repo.repoName || "Unknown"}
                      </CardTitle>
                      <CardDescription className="text-xs truncate">
                        {repo.metadata?.owner || "—"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleToggleFavorite(repo.id, repo.isFavorite, e)}
                    >
                      <Star className={`h-4 w-4 transition-colors ${
                        repo.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                      }`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={(e) => handleDelete(repo.id, e)}
                      disabled={deletingId === repo.id}
                    >
                      {deletingId === repo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {repo.metadata?.language && repo.metadata.language !== "Unknown" && (
                    <div className="flex items-center gap-1">
                      <Code2 className="h-3 w-3" />
                      <span>{repo.metadata.language}</span>
                    </div>
                  )}
                  {repo.metadata?.fileCount ? (
                    <div className="flex items-center gap-1">
                      <span>{repo.metadata.fileCount} files</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(repo.createdAt)}</span>
                  </div>
                </div>

                {/* Complexity badge */}
                {repo.metadata?.complexity && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getComplexityColor(repo.metadata.complexity)}`}
                  >
                    {repo.metadata.complexity}
                  </Badge>
                )}

                {/* Token usage indicator */}
                {repo.tokenUsage && repo.tokenUsage.totalTokens > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/5">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span>{(repo.tokenUsage.totalTokens / 1000).toFixed(1)}K tokens used</span>
                  </div>
                )}

                {/* Technologies */}
                {repo.metadata?.technologies && repo.metadata.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {repo.metadata.technologies.slice(0, 3).map((tech) => (
                      <span 
                        key={tech}
                        className="px-2 py-0.5 text-xs rounded-full bg-white/5 border border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                    {repo.metadata.technologies.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">
                        +{repo.metadata.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
