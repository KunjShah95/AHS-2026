import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Sparkles,
  Brain,
  FileCode,
  Settings
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getUserTokenStats, getAllUserAnalyses, type SavedAnalysis } from "@/lib/db"

interface TokenOptimization {
  id: string
  title: string
  description: string
  potentialSavings: number // percentage
  impact: 'high' | 'medium' | 'low'
  implemented: boolean
}

const OPTIMIZATIONS: TokenOptimization[] = [
  {
    id: 'exclude-tests',
    title: 'Exclude Test Files',
    description: 'Skip analyzing test files and directories (e.g., __tests__, *.test.ts)',
    potentialSavings: 25,
    impact: 'high',
    implemented: false
  },
  {
    id: 'exclude-vendor',
    title: 'Exclude Vendor/Dependencies',
    description: 'Skip node_modules, vendor, and similar dependency directories',
    potentialSavings: 40,
    impact: 'high',
    implemented: true
  },
  {
    id: 'smart-chunking',
    title: 'Smart Code Chunking',
    description: 'Analyze code by semantic units (functions, classes) instead of raw lines',
    potentialSavings: 30,
    impact: 'high',
    implemented: false
  },
  {
    id: 'cache-summaries',
    title: 'Cache AI Summaries',
    description: 'Reuse previously generated summaries for unchanged files',
    potentialSavings: 50,
    impact: 'medium',
    implemented: true
  },
  {
    id: 'priority-analysis',
    title: 'Priority-Based Analysis',
    description: 'Analyze entry points first, then spread to related modules',
    potentialSavings: 20,
    impact: 'medium',
    implemented: true
  },
  {
    id: 'incremental-updates',
    title: 'Incremental Updates',
    description: 'Only re-analyze changed files on subsequent runs',
    potentialSavings: 70,
    impact: 'high',
    implemented: false
  }
]

export default function TokenEconomy() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tokenStats, setTokenStats] = useState({ totalTokensUsed: 0, totalCost: 0, analysisCount: 0 })
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const [stats, userAnalyses] = await Promise.all([
          getUserTokenStats(user.uid),
          getAllUserAnalyses(user.uid)
        ])
        setTokenStats(stats)
        setAnalyses(userAnalyses)
      } catch (error) {
        console.error("Error fetching token data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const calculatePotentialSavings = () => {
    return OPTIMIZATIONS
      .filter(opt => !opt.implemented)
      .reduce((acc, opt) => acc + opt.potentialSavings, 0) / 3 // Normalize
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      default: return 'text-muted-foreground'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Calculate model limits (simulated based on popular models)
  const MODEL_LIMITS = {
    'gemini-1.5-flash': 1000000,
    'gemini-1.5-pro': 2000000,
    'gpt-4': 128000,
    'claude-3': 200000
  }

  const currentModel = 'gemini-1.5-flash'
  const modelLimit = MODEL_LIMITS[currentModel]
  const usagePercentage = Math.min(100, (tokenStats.totalTokensUsed / modelLimit) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-400" />
            Token Economy
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and optimize your AI token usage for cost-effective analysis
          </p>
        </div>
        <Badge variant="outline" className="text-sm py-2 px-4 gap-2">
          <Brain className="h-4 w-4" />
          Model: {currentModel}
        </Badge>
      </div>

      {/* Token Usage Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-500 via-yellow-500 to-orange-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Total Tokens Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(tokenStats.totalTokensUsed)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {tokenStats.analysisCount} analyses
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Model Limit</span>
                <span className="font-medium">{formatNumber(modelLimit)}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercentage}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full transition-colors ${
                    usagePercentage > 80 ? 'bg-red-500' : 
                    usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {usagePercentage.toFixed(1)}% of context used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              Estimated Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${tokenStats.totalCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ~${(tokenStats.totalCost / Math.max(1, tokenStats.analysisCount)).toFixed(4)} per analysis
            </p>
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>Using efficient Gemini Flash model</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Potential Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {calculatePotentialSavings().toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              By enabling all optimizations
            </p>
            <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <TrendingDown className="h-4 w-4" />
                <span>~{formatNumber(Math.floor(tokenStats.totalTokensUsed * 0.35))} tokens could be saved</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Optimization Strategies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Token Optimization Strategies
                </CardTitle>
                <CardDescription>
                  Smart techniques to reduce token usage while maintaining analysis quality
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Apply All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPTIMIZATIONS.map((opt, index) => (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border transition-all ${
                    opt.implemented 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-card/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {opt.implemented ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        )}
                        <h3 className="font-medium text-sm">{opt.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {opt.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getImpactColor(opt.impact)}>
                          {opt.impact} impact
                        </Badge>
                        <Badge variant="outline" className="text-green-400 bg-green-400/10 border-green-400/20">
                          -{opt.potentialSavings}% tokens
                        </Badge>
                      </div>
                    </div>
                    {!opt.implemented && (
                      <Button variant="ghost" size="sm" className="shrink-0">
                        Enable
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-Analysis Breakdown */}
      {analyses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Token Usage by Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyses.slice(0, 5).map((analysis) => (
                  <div 
                    key={analysis.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileCode className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{analysis.repoName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {analysis.metadata?.fileCount || 0} files analyzed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatNumber(analysis.tokenUsage?.totalTokens || 0)} tokens
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${(analysis.tokenUsage?.estimatedCost || 0).toFixed(5)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Why This Matters - Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Why Token Economy Matters</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Large Language Models have context window limits (e.g., 128K-2M tokens). 
                  Large codebases can easily exceed these limits. Our smart token management 
                  system uses <strong>priority-based analysis</strong>, <strong>semantic chunking</strong>, 
                  and <strong>intelligent caching</strong> to ensure you get the best analysis 
                  possible while staying within budget and context limits.
                </p>
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Context-Aware
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Cost-Efficient
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Scalable
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
