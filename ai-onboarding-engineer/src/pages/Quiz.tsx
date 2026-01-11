import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle2, XCircle, BrainCircuit, Trophy, Timer, AlertCircle } from "lucide-react"
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
      setQuiz(data)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResult(null)
    } catch (error) {
      console.error("Failed to load quiz:", error)
      setError("Failed to load quiz. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [setLoading, setQuiz, setCurrentQuestionIndex, setAnswers, setResult, setError])

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
      setQuiz(data)
      // Reset state
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResult(null)
    } catch (err) {
      console.error("Failed to load repository quiz:", err)
      // Fall back to demo quiz
      loadDemoQuiz()
    } finally {
      setLoading(false)
    }
  }, [currentRepository, user, loadDemoQuiz, setLoading, setError, setQuiz, setCurrentQuestionIndex, setAnswers, setResult])

  // Auto-load repository quiz if available
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
      // For demo purposes, we'll submit the answers we have
      const response = await api.post<QuizResult>("/quiz/submit", {
        quiz_id: quiz.id,
        user_id: user.uid,
        answers,
        time_taken_seconds: 300 // mocked
      })
      setResult(response)
    } catch (error) {
      console.error("Failed to submit quiz:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !quiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-red-500/10 p-6 rounded-full">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-bold">Cannot Load Quiz</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button size="lg" onClick={loadDemoQuiz} variant="outline">
          Try Demo Quiz
        </Button>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-primary/10 p-6 rounded-full">
          <BrainCircuit className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-bold">Knowledge Verification</h1>
          <p className="text-muted-foreground">
            Prove your mastery of the codebase. AI-generated quizzes adapt to your learning path.
          </p>
        </div>
        <div className="flex gap-3">
          {currentRepository && (
            <Button size="lg" onClick={loadRepositoryQuiz} className="gap-2">
              Generate Repository Quiz <Trophy className="h-4 w-4" />
            </Button>
          )}
          <Button size="lg" onClick={loadDemoQuiz} variant="outline" className="gap-2">
            Demo Assessment <Trophy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              {result.passed ? (
                <Trophy className="h-8 w-8 text-primary" />
              ) : (
                <Timer className="h-8 w-8 text-orange-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {result.passed ? "Assessment Passed!" : "Needs Improvement"}
            </CardTitle>
            <CardDescription>
              You scored {result.score} out of {result.total_points} points ({result.percentage.toFixed(0)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.question_results.map((qResult, idx) => (
                <div key={idx} className={`p-4 rounded-lg border flex gap-4 ${qResult.is_correct ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="shrink-0 mt-1">
                    {qResult.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">{quiz.questions.find(q => q.id === qResult.question_id)?.question}</p>
                    <p className="text-xs text-muted-foreground">{qResult.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setQuiz(null)}>Back to Dashboard</Button>
            {!result.passed && (
              <Button onClick={() => {
                setResult(null)
                setCurrentQuestionIndex(0)
                setAnswers({})
              }}>Retry Assessment</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  return (
    <div className="max-w-2xl mx-auto py-12 pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          <p className="text-muted-foreground">{quiz.description}</p>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1">
          <Timer className="h-3 w-3" /> {quiz.time_limit_minutes}m
        </Badge>
      </div>

      <div className="mb-6 flex items-center gap-2">
         <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-primary"
               initial={{ width: 0 }}
               animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
             />
         </div>
         <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentQuestionIndex + 1} / {quiz.questions.length}
         </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
               <div className="flex justify-between mb-2">
                 <Badge variant="secondary">{currentQuestion.concept}</Badge>
                 <span className="text-xs text-muted-foreground">{currentQuestion.points} pts</span>
               </div>
               <h3 className="text-lg font-medium leading-relaxed">
                  {currentQuestion.question}
               </h3>
            </CardHeader>
            <CardContent>
              {currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false' ? (
                <RadioGroup 
                  onValueChange={handleAnswer} 
                  value={answers[currentQuestion.id] || ""}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={option} id={`opt-${idx}`} />
                      <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="p-4 rounded-lg bg-muted text-center text-sm text-muted-foreground">
                  Text input not supported in this demo
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button onClick={handleNext}>
                {currentQuestionIndex === quiz.questions.length - 1 ? "Submit Assessment" : "Next Question"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
