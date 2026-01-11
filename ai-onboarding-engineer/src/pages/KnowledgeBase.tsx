import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  Tag
} from "lucide-react"

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
  const [data, setData] = useState<DemoData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        const response = await api.get<DemoData>("/knowledge/demo-data")
        setData(response)
      } catch (error) {
        console.error("Failed to fetch kbase:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDemoData()
  }, [])

  const getIconForType = (type: AnnotationType) => {
    switch (type) {
      case AnnotationType.MUST_KNOW: return <AlertTriangle className="text-orange-500" />
      case AnnotationType.GOTCHA: return <BookOpen className="text-blue-500" />
      case AnnotationType.SECURITY: return <Shield className="text-red-500" />
      case AnnotationType.BEST_PRACTICE: return <CheckCircle2 className="text-green-500" />
      default: return <Lightbulb className="text-yellow-500" />
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Collaborative Knowledge Base</h1>
           <p className="text-muted-foreground mt-1">
             Tribal knowledge captured directly from your senior engineers.
           </p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search annotations, guides, & gotchas..." 
             className="pl-9"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
             <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data?.stats.must_know_count}</div>
                <p className="text-sm text-muted-foreground">Critical "Must Know" items</p>
             </CardContent>
          </Card>
          <Card>
             <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data?.stats.verified_count}</div>
                <p className="text-sm text-muted-foreground">Verified by Tech Leads</p>
             </CardContent>
          </Card>
          <Card>
             <CardContent className="pt-6">
                <div className="text-2xl font-bold">{data?.stats.total_annotations}</div>
                <p className="text-sm text-muted-foreground">Total Code Annotations</p>
             </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="annotations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="annotations">Code Annotations</TabsTrigger>
          <TabsTrigger value="wiki">Guides & Wiki</TabsTrigger>
        </TabsList>
        
        <TabsContent value="annotations" className="mt-6 space-y-4">
           {getFilteredAnnotations().map((ann) => (
             <motion.div 
               key={ann.id} 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
             >
               <Card>
                 <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                   <div className="flex gap-3 items-start">
                     <div className="mt-1">{getIconForType(ann.annotation_type)}</div>
                     <div>
                       <CardTitle className="text-base font-medium">{ann.title}</CardTitle>
                       <CardDescription className="flex items-center gap-2 mt-1">
                         <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{ann.file_path}</span>
                         <span>•</span>
                         <span className="text-xs">By {ann.author_name}</span>
                       </CardDescription>
                     </div>
                   </div>
                   {ann.is_verified && (
                     <Badge variant="outline" className="border-green-500/50 text-green-600 gap-1">
                       <CheckCircle2 className="h-3 w-3" /> Verified
                     </Badge>
                   )}
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                   <div className="flex gap-2 mt-4 flex-wrap">
                      {ann.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                          #{tag}
                        </Badge>
                      ))}
                   </div>
                 </CardContent>
                 <CardFooter className="border-t bg-muted/20 py-2 flex justify-end gap-4">
                   <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs">
                     <ThumbsUp className="h-3 w-3" /> {ann.upvotes} Helpful
                   </Button>
                 </CardFooter>
               </Card>
             </motion.div>
           ))}
        </TabsContent>
        
        <TabsContent value="wiki" className="mt-6 space-y-4">
            {getFilteredEntries().map((entry) => (
              <motion.div 
               key={entry.id} 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
              >
               <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                 <CardHeader>
                   <div className="flex justify-between items-start">
                     <CardTitle className="text-lg">{entry.title}</CardTitle>
                     <Badge className={entry.importance === 'critical' ? 'bg-red-500' : 'bg-blue-500'}>
                       {entry.importance}
                     </Badge>
                   </div>
                   <CardDescription>
                      Category: <span className="capitalize">{entry.category}</span> • Author: {entry.author_name}
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <Eye className="h-3 w-3" /> {entry.views} views
                       </div>
                       <div className="flex items-center gap-1">
                         <ThumbsUp className="h-3 w-3" /> {entry.helpful_votes} helpful
                       </div>
                       <div className="flex items-center gap-1 ml-auto">
                         <Tag className="h-3 w-3" /> {entry.tags.join(', ')}
                       </div>
                    </div>
                 </CardContent>
               </Card>
              </motion.div>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
