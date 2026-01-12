import { Check, ShieldCheck, Binary, Sparkles, ArrowRight, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for open source projects and individual developers",
    features: [
      "5 repositories",
      "Basic analysis",
      "Community support",
      "Public roadmaps",
      "7-day retention"
    ],
    cta: "Start Free",
    href: "/register",
    highlighted: false,
    color: "text-gray-400"
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For growing teams and startups",
    features: [
      "Unlimited repositories",
      "Advanced AI analysis",
      "Priority support",
      "Private roadmaps",
      "Unlimited retention",
      "Team collaboration",
      "Custom integrations"
    ],
    cta: "Start Trial",
    href: "/register",
    highlighted: true,
    color: "text-indigo-400"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact sales",
    description: "For large organizations with advanced needs",
    features: [
      "Everything in Pro",
      "Self-hosted option",
      "SAML SSO",
      "Custom LLM training",
      "RBAC & audit logs",
      "24/7 priority support",
      "SLA guarantee",
      "Dedicated success manager"
    ],
    cta: "Contact Sales",
    href: "mailto:hello@cortex.ai",
    highlighted: false,
    color: "text-purple-400"
  }
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 flex flex-col items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/10 via-black to-black pointer-events-none" />
      
      <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-purple-500/05 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto pb-32">
        <header className="text-center space-y-8 mb-24">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2 font-mono text-[10px] text-indigo-300 uppercase tracking-[0.3em] italic"
           >
              /archive/economic-layer
           </motion.div>
           
           <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight italic">
                 Invest in <br /> <span className="not-italic text-gray-500">Velocity</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
                 The cost of senior mentoring is ~$40k/3mo. We deliver equivalent mastery instantly at institutional scale.
              </p>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              className={`relative flex flex-col p-10 rounded-4xl border-[1.5px] transition-all duration-500 group ${
                tier.highlighted
                  ? "border-indigo-500/40 bg-indigo-500/05 shadow-[0_40px_120px_-20px_rgba(79,70,229,0.2)] scale-105 z-20" 
                  : "border-gray-900 bg-gray-900/40 hover:border-gray-800"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic shadow-2xl">
                  Most Preferred
                </div>
              )}

              <div className="mb-10 space-y-1">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{tier.name}</h3>
                   {tier.highlighted && <Sparkles className="h-5 w-5 text-indigo-400" />}
                </div>
                <div className="flex items-baseline gap-2 pt-4">
                  <span className="text-5xl font-black text-white italic tracking-tighter tabular-nums leading-none">
                    {tier.price}
                  </span>
                  <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic pt-1">
                    {tier.period}
                  </span>
                </div>
                <p className="text-gray-500 font-medium italic text-sm pt-4 leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-5 mb-12 py-8 border-y border-gray-800/50">
                <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] italic mb-4">Core Protocols</div>
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-4 group/feature">
                    <div className="h-5 w-5 rounded-lg bg-black/40 border border-gray-800 flex items-center justify-center shrink-0 mt-0.5 group-hover/feature:border-indigo-500/40 transition-colors shadow-inner">
                       <Check className={`h-3 w-3 ${tier.color} opacity-40 group-hover/feature:opacity-100 transition-opacity`} />
                    </div>
                    <span className="text-gray-400 font-medium italic text-sm group-hover:text-gray-200 transition-colors">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full h-16 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl italic active:scale-95 group/btn shadow-2xl ${
                  tier.highlighted
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-black border border-gray-800 text-gray-600 hover:text-white hover:border-gray-600"
                }`}
                asChild
              >
                <Link to={tier.href}>
                   {tier.cta}
                   <ArrowRight className="ml-3 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-40 p-12 md:p-20 rounded-5xl bg-indigo-600/05 border border-indigo-500/10 flex flex-col items-center gap-12 text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-160 h-160 bg-indigo-500/05 rounded-full blur-[120px] pointer-events-none" />
           <div className="space-y-4 max-w-2xl relative z-10">
              <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <Gauge className="h-8 w-8 text-indigo-400 shadow-2xl" />
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-white italic">Institutional Trust</h3>
              <p className="text-gray-500 leading-relaxed font-medium italic text-xl">
                 Integrated by world-class engineering collectives to maximize human capital yield and architectural integrity.
              </p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-16 md:gap-24 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-1000">
              {['Google', 'Meta', 'Stripe', 'Vercel', 'Linear'].map(company => (
                <span key={company} className="text-2xl font-black uppercase tracking-[0.4em] italic text-gray-400">{company}</span>
              ))}
           </div>
        </div>
      </div>

      <footer className="footer-fixed flex items-center justify-between text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] pt-12 border-t border-gray-900 px-12 pb-12 w-full absolute bottom-0 left-0 bg-black/80 backdrop-blur-xl z-20">
         <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            Pricing Engine Active
         </div>
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
               <ShieldCheck className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
               <Binary className="h-3.5 w-3.5 text-gray-800" />
               <span className="opacity-60">Institutional Suite v2.8.0</span>
            </div>
            <div>Institutional Snapshot: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
         </div>
      </footer>
    </div>
  )
}
