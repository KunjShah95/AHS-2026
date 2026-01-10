/*
BILLION: Worth $1B because it offers secure, frictionless entry.
DIRECTION: Deep Engineering / Minimalist
SIGNATURE: Clean Auth Form
ESCAPE: Standard auth forms are boring. This one feels like entering a command center.
LOCKED: Deep Engineering
*/
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Github, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { createUserWithEmailAndPassword, GithubAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate("/")
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGithubRegister = async () => {
    setLoading(true)
    setError("")
    try {
      const provider = new GithubAuthProvider()
      await signInWithPopup(auth, provider)
      navigate("/")
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start onboarding engineers at the speed of AI.
          </p>
        </div>

        <div className="space-y-4">
           <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5" onClick={handleGithubRegister} disabled={loading}>
             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />} Sign up with GitHub
           </Button>
           
           <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
               <div className="space-y-2">
                  <Input 
                    type="email" 
                    placeholder="name@company.com" 
                    className="h-11 bg-black/20 border-white/10 focus-visible:ring-primary/50" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
               </div>
               <div className="space-y-2">
                  <Input 
                    type="password" 
                    placeholder="Create a password" 
                    className="h-11 bg-black/20 border-white/10 focus-visible:ring-primary/50" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
               </div>
               
               {error && <p className="text-red-500 text-sm text-center">{error}</p>}

               <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create account"}
               </Button>
            </form>
        </div>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
           Already have an account? <Link to="/login" className="underline underline-offset-4 hover:text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
