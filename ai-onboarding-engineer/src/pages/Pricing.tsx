import { Check, ShieldCheck, Binary, Sparkles, ArrowRight, Gauge, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    color: "text-cyan-400"
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
    color: "text-primary"
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
    color: "text-accent"
  }
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground py-24 px-6 md:px-8 flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="absolute top-0 right-0 w-160 h-160 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-160 h-160 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto pb-32">
        {/* Header */}
        <motion.header 
          className="text-center space-y-8 mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="accent" className="mx-auto">
            <Zap className="h-3 w-3" />
            Economic Layers
          </Badge>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-foreground">Invest in</span>
              {" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Velocity
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              The cost of senior mentoring is ~$40k/3mo. We deliver equivalent mastery instantly at institutional scale.
            </p>
          </div>
        </motion.header>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-32">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className={tier.highlighted ? "md:scale-105 md:z-20" : ""}
            >
              <Card 
                variant={tier.highlighted ? "glow" : "default"}
                className="h-full flex flex-col relative overflow-hidden group hover:shadow-card-elevated transition-shadow"
              >
                {tier.highlighted && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge variant="accent" size="md" className="shadow-lg">
                      <Sparkles className="h-3 w-3" />
                      Most Preferred
                    </Badge>
                  </motion.div>
                )}

                <CardContent className="p-8 md:p-10 flex flex-col flex-1">
                  {/* Tier Header */}
                  <div className="mb-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground uppercase tracking-tight">
                        {tier.name}
                      </h3>
                      {tier.highlighted && (
                        <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 3, repeat: Infinity, repeatType: "loop" }}>
                          <Sparkles className={`h-5 w-5 ${tier.color}`} />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl md:text-6xl font-bold text-foreground tabular-nums tracking-tight">
                        {tier.price}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pt-1">
                        {tier.period}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground font-medium pt-2 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="flex-1 space-y-4 py-8 border-y border-border/30 mb-10">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                      Included Features
                    </div>
                    {tier.features.map((feature, featureIdx) => (
                      <motion.div 
                        key={feature} 
                        className="flex items-start gap-3 group/feature"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 + featureIdx * 0.05 }}
                      >
                        <div className="h-5 w-5 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/feature:scale-110 transition-transform shadow-sm">
                          <Check className={`h-3 w-3 ${tier.color}`} />
                        </div>
                        <span className="text-sm text-foreground/80 font-medium group-hover/feature:text-foreground transition-colors">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    size="lg"
                    variant={tier.highlighted ? "default" : "outline"}
                    className="w-full h-12 font-semibold uppercase tracking-wide shadow-md hover:shadow-lg group/btn"
                    asChild
                  >
                    <Link to={tier.href} className="flex items-center justify-center gap-2">
                      {tier.cta}
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust Section */}
        <motion.div 
          className="p-12 md:p-16 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col items-center gap-12 text-center relative overflow-hidden group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="absolute top-0 right-0 w-160 h-160 bg-accent/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent/20 transition-all duration-1000" />
          
          <div className="space-y-4 max-w-2xl relative z-10">
            <motion.div 
              className="h-16 w-16 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto shadow-md"
              whileHover={{ scale: 1.1 }}
            >
              <Gauge className="h-8 w-8 text-accent" />
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-foreground uppercase tracking-tight">
              Trusted by Industry Leaders
            </h3>
            
            <p className="text-base text-muted-foreground leading-relaxed font-medium">
              Integrated by world-class engineering teams to maximize human capital yield and architectural integrity across organizations.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-1000">
            {['Google', 'Meta', 'Stripe', 'Vercel', 'Linear'].map(company => (
              <span key={company} className="text-base md:text-lg font-bold uppercase tracking-wider text-foreground/70">
                {company}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between text-xs font-semibold uppercase tracking-widest px-6 md:px-8 py-4 bg-background/80 backdrop-blur-md border-t border-border/30 z-20">
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-muted-foreground">Pricing Engine Active</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
          <div>
            {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        </div>
      </footer>
    </div>
  )
}
