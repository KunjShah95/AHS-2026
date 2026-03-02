import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Fingerprint, ArrowRight, ShieldCheck, Lock } from "lucide-react"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()

  const handleGoogleLogin = async () => {
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 overflow-hidden py-12">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-160 h-160 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center space-y-8 mb-12">
          <Badge variant="accent">
            <Lock className="h-3 w-3" />
            Identity Validation
          </Badge>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              <span className="text-foreground">Access your</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fleet
              </span>
            </h1>
            <p className="text-base text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
              Initialize your session and synchronize with your architectural context.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card variant="glow" className="rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
          <CardContent className="p-8 md:p-10 space-y-8">
            {/* Error Message */}
            {error && (
              <motion.div 
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="h-10 w-10 rounded-md bg-destructive/15 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-semibold">{error}</p>
              </motion.div>
            )}

            {/* Login Button */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Authentication</div>
              
              <Button 
                size="lg"
                className="w-full h-12 bg-foreground text-background font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 group flex items-center justify-center gap-3"
                onClick={handleGoogleLogin} 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                )}
                <span>Continue with Google</span>
              </Button>
            </div>

            {/* Security Features */}
            <div className="flex items-start gap-3 pt-6 border-t border-border/30">
              <motion.div 
                className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.1 }}
              >
                <ShieldCheck className="h-5 w-5 text-primary" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground/70 uppercase tracking-widest">
                  Secure & Encrypted
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enterprise-grade authentication with multi-factor support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            v8.4.2 • Enterprise Gateway
          </p>
          <p className="text-sm text-muted-foreground">
            New member?{" "}
            <Link 
              to="/register" 
              className="text-primary hover:text-accent font-semibold transition-colors underline underline-offset-4 decoration-primary/30"
            >
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between text-xs font-semibold uppercase tracking-widest px-6 md:px-8 py-4 bg-background/80 backdrop-blur-md border-t border-border/30 z-20">
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-muted-foreground">Gateway Active</span>
        </div>
        
        <div className="hidden md:flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            <span>Biometric Ready</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
    </div>
  )
}
