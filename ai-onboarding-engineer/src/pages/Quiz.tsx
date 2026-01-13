import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle2, XCircle, Trophy, Timer, AlertCircle, ChevronRight, Binary, Gauge, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRepository } from "@/hooks/useRepository"

interface QuizQuestion {
  id: string
  question: string
  question_type: string
  options?: string[]
  points: number
  concept: string
}

interface Quiz {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
  time_limit_minutes: number
  passing_score: number
  difficulty: "beginner" | "intermediate" | "advanced"
  repo_id?: string
  repo_name?: string
}

interface QuizResult {
  score: number
  total_points: number
  percentage: number
  passed: boolean
  question_results: Array<{
    question_id: string
    is_correct: boolean
    explanation: string
  }>
}

export default function QuizPage() {
  const { user } = useAuth()
  const { currentRepository } = useRepository()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDemoQuiz = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Quiz>("/quiz/demo-quiz")
      setQuiz(data.data)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResult(null)
    } catch (error) {
      console.error("Failed to load quiz:", error)
      setError("Failed to load quiz. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRepositoryQuiz = useCallback(async () => {
    if (!currentRepository || !user) {
      setError("No repository selected. Please analyze a repository first.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await api.post<Quiz>("/quiz/generate-from-repo", {
        repo_id: currentRepository.id,
        user_id: user.uid,
        difficulty: "intermediate",
      })
      setQuiz(data.data)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResult(null)
    } catch (err) {
      console.error("Failed to load repository quiz:", err)
      loadDemoQuiz()
    } finally {
      setLoading(false)
    }
  }, [currentRepository, user, loadDemoQuiz])

  useEffect(() => {
    if (currentRepository && !quiz) {
      loadRepositoryQuiz()
    }
  }, [currentRepository, quiz, loadRepositoryQuiz])

  const handleAnswer = (value: string) => {
    if (!quiz) return
    setAnswers(prev => ({
      ...prev,
      [quiz.questions[currentQuestionIndex].id]: value
    }))
  }

  const handleNext = () => {
    if (!quiz) return
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!quiz || !user) return
    setLoading(true)
    try {
      const response = await api.post<QuizResult>("/quiz/submit", {
        quiz_id: quiz.id,
        user_id: user.uid,
        answers,
        time_taken_seconds: 300 
      })
      setResult(response.data)
    } catch (error) {
      console.error("Failed to submit quiz:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Synthesizing Assessment...</span>
      </div>
    )
  }

  if (error && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-6">
        <div className="bg-rose-500/10 p-6 rounded-full border border-rose-500/20">
          <AlertCircle className="h-12 w-12 text-rose-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Assessment Failed</h1>
          <p className="text-gray-500 font-medium italic">{error}</p>
        </div>
        <Button size="lg" onClick={loadDemoQuiz} className="bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl px-10 h-14 hover:bg-gray-200 shadow-2xl transition-all">
          Try Mock Assessment
        </Button>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center py-20 px-6">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
        <div className="relative z-10 space-y-12">
           <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.2em]">
              /dev/validation
           </div>
           
           <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
                Knowledge <span className="not-italic text-gray-400">Verification</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
                Calibrate your proficiency against the codebase architecture. High-fidelity assessment for rapid competency validation.
              </p>
           </div>

           <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {currentRepository ? (
                <Button size="lg" onClick={loadRepositoryQuiz} className="h-20 px-12 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center gap-4">
                  Initialize Repo Audit
                  <Trophy className="h-5 w-5" />
                </Button>
              ) : (
                <div className="p-8 rounded-4xl bg-gray-900/40 border border-gray-800 text-gray-500 font-medium italic">
                   Analyze a repository to generate a custom assessment cluster.
                </div>
              )}
           </div>
           
           <Button variant="ghost" onClick={loadDemoQuiz} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-indigo-400">
              Run Infrastructure Mock
           </Button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center overflow-hidden">
        <div className="max-w-2xl w-full space-y-8 relative">
           <div className={`absolute -inset-20 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] ${result.passed ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent blur-[120px] pointer-events-none`} />
           
           <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl relative z-10">
              <CardHeader className="text-center p-12">
                <div className={`mx-auto h-24 w-24 rounded-3xl mb-8 flex items-center justify-center border-2 ${result.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} shadow-2xl`}>
                  {result.passed ? (
                    <Trophy className="h-10 w-10 text-emerald-400" />
                  ) : (
                    <Gauge className="h-10 w-10 text-rose-400" />
                  )}
                </div>
                <CardTitle className="text-4xl font-black uppercase tracking-tighter mb-2 italic">
                  {result.passed ? "Cycle Confirmed" : "Logic Fragility"}
                </CardTitle>
                <CardDescription className="text-gray-500 font-medium italic text-lg">
                  Proficiency Yield: {result.score} / {result.total_points} ({result.percentage.toFixed(0)}%)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-12 pt-0 space-y-6">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-4 px-2 italic">Artifact Resolution Log</div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.question_results.map((qResult, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border flex gap-6 ${qResult.is_correct ? 'bg-black/40 border-emerald-500/20' : 'bg-black/40 border-rose-500/20'} transition-all group`}>
                      <div className="shrink-0 pt-1">
                        {qResult.is_correct ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-sm uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors italic">
                           {quiz.questions.find(q => q.id === qResult.question_id)?.question}
                        </p>
                        <p className="text-xs text-gray-500 font-medium italic leading-relaxed">{qResult.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-12 pt-0 flex flex-col sm:flex-row gap-4">
                <Button variant="ghost" className="flex-1 h-16 rounded-2xl bg-black/40 border border-gray-800 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all" onClick={() => setQuiz(null)}>Exit Validation</Button>
                {!result.passed && (
                  <Button className="flex-1 h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 shadow-2xl transition-all" onClick={() => {
                    setResult(null)
                    setCurrentQuestionIndex(0)
                    setAnswers({})
                  }}>Re-initialize Cycle</Button>
                )}
              </CardFooter>
           </Card>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/05 via-black to-black pointer-events-none" />
      
      <div className="max-w-3xl w-full space-y-12 relative z-10 pb-32">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-900">
           <div className="space-y-1 text-center md:text-left">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic text-indigo-400">{quiz.title}</h2>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 italic">{quiz.description}</div>
           </div>
           <Badge className="bg-white/5 border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl">
              <Timer className="h-3 w-3 mr-2" /> Protocol Window: {quiz.time_limit_minutes}m
           </Badge>
        </header>

        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Assessment Flow Progression</div>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest tabular-nums">
                 {currentQuestionIndex + 1} / {quiz.questions.length}
              </div>
           </div>
           <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                 />
           </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gray-900/40 border border-gray-800 rounded-4xl overflow-hidden shadow-2xl">
              <CardHeader className="p-10">
                 <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest shadow-inner">
                      <Binary className="h-3 w-3" />
                      Concept: {currentQuestion.concept}
                   </div>
                   <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest tabular-nums italic">{currentQuestion.points} Yield Credits</span>
                 </div>
                 <h3 className="text-3xl font-bold uppercase tracking-tighter leading-tight text-white italic">
                    {currentQuestion.question}
                 </h3>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                {currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false' ? (
                  <RadioGroup 
                    onValueChange={handleAnswer} 
                    value={answers[currentQuestion.id] || ""}
                    className="grid grid-cols-1 gap-4"
                  >
                    {currentQuestion.options?.map((option, idx) => (
                      <div key={idx} className="relative group">
                          <RadioGroupItem value={option} id={`opt-${idx}`} className="sr-only" />
                          <Label 
                            htmlFor={`opt-${idx}`} 
                            className={`flex items-center px-8 h-20 rounded-2xl border-2 cursor-pointer transition-all duration-300 font-bold uppercase tracking-tight text-sm ${
                              answers[currentQuestion.id] === option 
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]' 
                              : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-700 hover:bg-white/5'
                            }`}
                          >
                            <div className={`h-6 w-6 rounded-full border-2 mr-6 flex items-center justify-center transition-all ${
                               answers[currentQuestion.id] === option ? 'bg-white border-white' : 'border-gray-700'
                            }`}>
                               {answers[currentQuestion.id] === option && <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                            </div>
                            {option}
                          </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="p-12 rounded-4xl bg-black/40 border border-gray-800 text-center text-[10px] font-black uppercase tracking-widest text-gray-700 italic">
                    Neural input buffer for textual resolution is currently inactive.
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-10 flex justify-between gap-6">
                <Button 
                  variant="ghost" 
                  className="px-8 h-14 bg-transparent text-gray-600 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all italic"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Return Previous
                </Button>
                <Button className="flex-1 h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 group shadow-2xl" onClick={handleNext}>
                  {currentQuestionIndex === quiz.questions.length - 1 ? "Submit Final Audit" : "Commit Sequence"}
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              Verification Cycle Active
           </div>
           <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
        </footer>
      </div>
    </div>
  )
}
