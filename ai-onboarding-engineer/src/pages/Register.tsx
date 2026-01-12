import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight, ShieldCheck, Binary, Sparkles } from "lucide-react"
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

export default function Register() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { signInWithGoogle } = useAuth()

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20 pointer-events-none" />
      
      <div className="absolute top-0 left-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-160 h-160 bg-emerald-500/05 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="text-center space-y-8 mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2 font-mono text-[10px] text-emerald-300 uppercase tracking-[0.2em]">
            /gateway/access-initialization
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
              Initialize <span className="not-italic text-gray-500">Access</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium italic max-w-sm mx-auto leading-relaxed">
              Join the institutional collective and automate architectural intelligence.
            </p>
          </div>
        </div>

        <Card className="bg-gray-900/40 border border-gray-800 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
          <CardContent className="p-12 space-y-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 group"
              >
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Binary className="h-5 w-5 text-rose-500" />
                </div>
                <p className="text-rose-400 text-xs font-black uppercase tracking-widest italic">{error}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] px-2 italic">Institutional Onboarding</div>
              
              <Button 
                className="w-full h-20 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-6 group/btn overflow-hidden relative"
                onClick={handleGoogleRegister} 
                disabled={loading}
              >
                <div className="absolute inset-0 bg-linear-to-r from-emerald-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <GoogleIcon className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                )}
                <span>Initialize with Institutional ID</span>
                <ArrowRight className="h-5 w-5 text-black/40 group-hover/btn:translate-x-1 group-hover/btn:text-black transition-all" />
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-10 border-t border-gray-800/50">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest leading-relaxed italic">
                Advanced Knowledge Liquidity • Automated Context Ingestion • Systematic Velocity Reclaim
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center space-y-6">
           <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] italic">
             Enterprise Node Initialization • v2.1.0
           </p>
           <p className="text-gray-500 text-xs font-medium italic">
             Already part of the collective? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-8 decoration-indigo-500/30">Verify Identity</Link>
           </p>
        </div>
      </motion.div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-800 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900/50 px-12 pb-12 w-full absolute bottom-0 left-0">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            Provisioning Link Active
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <ShieldCheck className="h-3.5 w-3.5" />
               Zero-Knowledge Proof
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
