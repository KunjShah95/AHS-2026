/*
BILLION: Worth $1B because it offers secure, frictionless entry.
DIRECTION: Deep Engineering / Minimalist
SIGNATURE: Clean Auth Form
ESCAPE: Standard auth forms are boring. This one feels like entering a command center.
LOCKED: Deep Engineering
*/
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate("/dashboard")
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



  const handleGoogleRegister = async () => {
    setLoading(true)
    setError("")
    try {
      await signInWithGoogle()
      navigate("/dashboard")
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
           <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5" onClick={handleGoogleRegister} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />} Google
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
