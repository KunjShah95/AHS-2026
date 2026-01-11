/*
BILLION: Pricing that feels like an infrastructure investment, not a subscription.
DIRECTION: Clean / Industrial / Transparent
SIGNATURE: Grid-based comparison
*/

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"

const tiers = [
  {
    name: "Hobbyist",
    price: "$0",
    description: "For open source maintainers and curious engineers.",
    features: [
      "Public Repo Analysis",
      "Basic Architecture Graphs",
      "3 AI Tutor Queries / Day",
      "Community Support",
      "7-day Context Retention"
    ],
    notIncluded: [
      "Private Repos",
      "Team Onboarding",
      "SSO",
      "CI/CD Integration"
    ],
    cta: "Start Free",
    href: "/register",
    variant: "outline"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations requiring absolute security and control.",
    features: [
      "Self-Hosted / On-Prem Option",
      "SAML SSO & Audit Logs",
      "Custom LLM Fine-tuning",
      "Role-Based Access Control",
      "24/7 Priority Support",
      "Unlimited Retention"
    ],
    notIncluded: [],
    cta: "Contact Sales",
    href: "mailto:sales@cortex.ai",
    variant: "outline"
  }
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
             <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight">
            Invest in <span className="text-primary">Velocity</span>.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The cost of a senior engineer strictly mentoring a junior for 3 months is ~$40,000.  <br/>
            Cortex does it for a fraction of the price, instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex flex-col p-8 rounded-2xl border ${
                tier.variant === "default"
                  ? "border-primary/50 bg-primary/5 shadow-2xl shadow-primary/10" 
                  : "border-white/10 bg-card/40 backdrop-blur-sm hover:border-white/20"
              } transition-all duration-300`}
            >


              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono">{tier.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
                {tier.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground/50">
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="line-through">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={tier.variant === "default" ? "default" : "outline"} 
                className={`w-full h-12 ${tier.variant === 'outline' ? 'border-white/10 hover:bg-white/5' : ''}`}
                asChild
              >
                <Link to={tier.href}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 text-center">
            <h4 className="text-lg font-medium mb-6">Trusted by engineering teams at</h4>
            <div className="flex flex-wrap justify-center gap-10 opacity-40 grayscale mix-blend-screen">
                <span className="text-xl font-display font-bold">Vercel</span>
                <span className="text-xl font-display font-bold">Linear</span>
                <span className="text-xl font-display font-bold">Stripe</span>
                <span className="text-xl font-display font-bold">OpenAI</span>
            </div>
        </div>
      </div>
    </div>
  )
}
