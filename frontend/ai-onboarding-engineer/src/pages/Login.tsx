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
import { useState } from "react"
import { signInWithEmailAndPassword, GithubAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/")
    } catch (err: any) {
      console.error(err)
      setError("Failed to sign in. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setLoading(true)
    setError("")
    try {
      const provider = new GithubAuthProvider()
      await signInWithPopup(auth, provider)
      navigate("/")
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the Context Engine.
          </p>
        </div>

        <div className="space-y-4">
           <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5" onClick={handleGithubLogin} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />} Continue with GitHub
           </Button>
           
           <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="••••••••" 
                    className="h-11 bg-black/20 border-white/10 focus-visible:ring-primary/50" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
               </div>
               
               {error && <p className="text-red-500 text-sm text-center">{error}</p>}

               <Button type="submit" className="w-full h-11 text-base bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
               </Button>
            </form>
        </div>
        
        <p className="px-8 text-center text-sm text-muted-foreground">
           Don't have an account? <Link to="/register" className="underline underline-offset-4 hover:text-primary cursor-pointer">Register</Link>
        </p>
      </div>
    </div>
  )
}
