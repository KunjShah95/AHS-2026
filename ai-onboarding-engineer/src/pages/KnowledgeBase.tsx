import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  BookOpen, 
  AlertTriangle, 
  Shield, 
  Lightbulb, 
  ThumbsUp, 
  Eye,
  CheckCircle2,
  Loader2,
  Binary,
  Bookmark,
  ChevronRight
} from "lucide-react"
import { useRepository } from "@/hooks/useRepository"
import { useAuth } from "@/hooks/useAuth"

const AnnotationType = {
  MUST_KNOW: "must_know",
  GOTCHA: "gotcha",
  BEST_PRACTICE: "best_practice",
  DEPRECATED: "deprecated",
  SECURITY: "security"
} as const

type AnnotationType = typeof AnnotationType[keyof typeof AnnotationType]

interface Annotation {
  id: string
  title: string
  content: string
  annotation_type: AnnotationType
  file_path: string
  author_name: string
  upvotes: number
  is_verified: boolean
  tags: string[]
}

interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  author_name: string
  views: number
  helpful_votes: number
  tags: string[]
  importance: string
}

interface DemoData {
  annotations: Annotation[]
  knowledge_entries: KnowledgeEntry[]
  stats: {
    must_know_count: number
    verified_count: number
    total_annotations: number
  }
}

export default function KnowledgeBase() {
  const { currentRepository } = useRepository()
  const { user } = useAuth()
  const [data, setData] = useState<DemoData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const loadDemoData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<DemoData>("/knowledge/demo-data")
      setData(response.data)
    } catch (err) {
      console.error("Failed to fetch demo knowledge base:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRepositoryKnowledgeBase = useCallback(async () => {
    if (!currentRepository || !user) return

    try {
      setLoading(true)
      const response = await api.post<DemoData>("/knowledge/generate-from-repo", {
        repo_id: currentRepository.id,
        user_id: user.uid,
      })
      setData(response.data)
    } catch (err) {
      console.error("Failed to fetch repository knowledge base:", err)
      loadDemoData()
    } finally {
      setLoading(false)
    }
  }, [currentRepository, user, loadDemoData])

  useEffect(() => {
    if (currentRepository && user) {
      loadRepositoryKnowledgeBase()
    } else if (!currentRepository) {
      loadDemoData()
    }
  }, [currentRepository, user, loadRepositoryKnowledgeBase, loadDemoData])

  const getIconForType = (type: AnnotationType) => {
    switch (type) {
      case AnnotationType.MUST_KNOW: return <AlertTriangle className="text-orange-400" />
      case AnnotationType.GOTCHA: return <BookOpen className="text-indigo-400" />
      case AnnotationType.SECURITY: return <Shield className="text-rose-400" />
      case AnnotationType.BEST_PRACTICE: return <CheckCircle2 className="text-emerald-400" />
      default: return <Lightbulb className="text-amber-400" />
    }
  }

  const getFilteredAnnotations = () => {
    if (!data) return []
    if (!searchQuery) return data.annotations
    const lower = searchQuery.toLowerCase()
    return data.annotations.filter(a => 
      a.title.toLowerCase().includes(lower) || 
      a.content.toLowerCase().includes(lower) ||
      a.tags.some(t => t.toLowerCase().includes(lower))
    )
  }

  const getFilteredEntries = () => {
    if (!data) return []
    if (!searchQuery) return data.knowledge_entries
    const lower = searchQuery.toLowerCase()
    return data.knowledge_entries.filter(e => 
      e.title.toLowerCase().includes(lower) || 
      e.content.toLowerCase().includes(lower) ||
      e.tags.some(t => t.toLowerCase().includes(lower))
    )
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Neural Archive...</span>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-900">
           <div className="space-y-4">
              <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
                 /archive/tribal-memory
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
                Codex <span className="not-italic text-gray-500">Registry</span>
              </h1>
              <p className="text-lg text-gray-500 font-medium italic">
                Institutional wisdom synthesized from the core artifact cluster.
              </p>
           </div>
           
           <div className="relative group w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-indigo-400 transition-colors" />
              <Input 
                placeholder="Search institutional memory..." 
                className="h-14 pl-12 bg-gray-900/40 border-gray-800 focus:border-indigo-500/50 rounded-2xl text-white placeholder:text-gray-700 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Critical Logic", val: data?.stats.must_know_count, icon: AlertTriangle, color: "text-orange-400" },
             { label: "Lead Verified", val: data?.stats.verified_count, icon: Shield, color: "text-indigo-400" },
             { label: "Code Entities", val: data?.stats.total_annotations, icon: Binary, color: "text-emerald-400" }
           ].map((stat, i) => (
             <Card key={i} className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden group hover:border-gray-700 transition-all">
                <CardContent className="p-8 flex items-center justify-between">
                   <div className="space-y-1">
                      <div className="text-4xl font-black text-white tabular-nums tracking-tighter">{stat.val}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{stat.label}</div>
                   </div>
                   <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>

        <Tabs defaultValue="annotations" className="w-full space-y-8">
          <TabsList className="bg-gray-900/40 p-1.5 rounded-2xl border border-gray-800 h-16 w-full max-w-md">
            <TabsTrigger value="annotations" className="rounded-xl h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Binary className="h-4 w-4 mr-2" />
              Code Annotations
            </TabsTrigger>
            <TabsTrigger value="wiki" className="rounded-xl h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Institutional Guides
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="annotations" className="space-y-6">
             <div className="grid grid-cols-1 gap-6">
                {getFilteredAnnotations().map((ann, i) => (
                  <motion.div 
                    key={ann.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <CardHeader className="p-8 pb-4">
                         <div className="flex items-start justify-between">
                           <div className="flex gap-6 items-start">
                              <div className="h-14 w-14 rounded-2xl bg-black/40 border border-gray-800 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                 {getIconForType(ann.annotation_type)}
                              </div>
                              <div className="space-y-2">
                                 <h3 className="text-2xl font-bold uppercase tracking-tighter text-white">{ann.title}</h3>
                                 <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border border-gray-800 font-mono text-[10px] text-gray-500 tracking-tight italic">
                                       <Bookmark className="h-3 w-3 text-indigo-400" />
                                       {ann.file_path}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">By {ann.author_name}</span>
                                 </div>
                              </div>
                           </div>
                           {ann.is_verified && (
                             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">
                               <CheckCircle2 className="h-3 w-3" /> Verified Node
                             </div>
                           )}
                         </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-4">
                         <p className="text-gray-400 text-lg leading-relaxed font-medium mb-8">
                           {ann.content}
                         </p>
                         <div className="flex items-center justify-between pt-8 border-t border-gray-800/50">
                            <div className="flex gap-3">
                               {ann.tags.map(tag => (
                                 <Badge key={tag} className="bg-indigo-500/10 text-indigo-400 border-indigo-500/10 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors">
                                   #{tag}
                                 </Badge>
                               ))}
                            </div>
                            <Button variant="ghost" className="h-10 px-6 rounded-xl bg-black/40 border border-gray-800 hover:bg-white/5 gap-3 text-[10px] font-black uppercase tracking-widest group">
                               <ThumbsUp className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" /> {ann.upvotes} Confirmations
                            </Button>
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
             </div>
          </TabsContent>
          
          <TabsContent value="wiki" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredEntries().map((entry, i) => (
                  <motion.div 
                   key={entry.id} 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                  >
                   <Card className="h-full bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col">
                     <CardHeader className="p-8">
                        <div className="flex justify-between items-start mb-4">
                           <div className="h-12 w-12 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-indigo-400" />
                           </div>
                           <Badge className={`${entry.importance === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full`}>
                             {entry.importance} Priority
                           </Badge>
                        </div>
                        <h3 className="text-2xl font-bold uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors">{entry.title}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-2">
                           Category: <span className="text-gray-400">{entry.category}</span> • Source: {entry.author_name}
                        </p>
                     </CardHeader>
                     <CardContent className="p-8 pt-0 flex-1">
                        <p className="text-gray-500 font-medium leading-relaxed italic line-clamp-4">
                          {entry.content}
                        </p>
                     </CardContent>
                     <CardFooter className="p-8 pt-0 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-700">
                             <Eye className="h-3 w-3" /> {entry.views} Reads
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-700">
                             <ThumbsUp className="h-3 w-3" /> {entry.helpful_votes} Helpful
                           </div>
                        </div>
                        <Button variant="ghost" className="h-10 w-10 rounded-xl bg-black/40 border border-gray-800 hover:bg-white/5 flex items-center justify-center p-0 transition-all">
                           <ChevronRight className="h-4 w-4" />
                        </Button>
                     </CardFooter>
                   </Card>
                  </motion.div>
                ))}
              </div>
          </TabsContent>
        </Tabs>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Codex Registry Active
           </div>
           <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        </footer>
      </div>
    </div>
  )
}
