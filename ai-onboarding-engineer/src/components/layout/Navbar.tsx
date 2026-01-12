import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Terminal, ChevronRight, ChevronDown, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"

export function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const navCommands = [
    { cmd: "analysis", path: "/analysis" },
    { cmd: "roadmap", path: "/roadmap" },
    { cmd: "arch", path: "/architecture" },
    { cmd: "tasks", path: "/tasks" },
    { cmd: "team", path: "/team-analytics" },
    { cmd: "dashboard", path: "/dashboard" },
  ]

  const advancedFeatures = [
    { cmd: "flow-tracer", path: "/flow-tracer", label: "Flow Tracer", category: "Analysis" },
    { cmd: "tech-debt", path: "/tech-debt", label: "Tech Debt Heatmap", category: "Analysis" },
    { cmd: "critical-paths", path: "/critical-paths", label: "Critical Paths", category: "Analysis" },
    { cmd: "where-look", path: "/where-look", label: "Where to Look", category: "Discovery" },
    { cmd: "skill-gaps", path: "/skill-gaps", label: "Skill Gaps", category: "Discovery" },
    { cmd: "learning", path: "/learning-progress", label: "My Progress", category: "Learning" },
    { cmd: "benchmarks", path: "/benchmarks", label: "Benchmarks", category: "Learning" },
    { cmd: "probation", path: "/probation", label: "Success Predictor", category: "Learning" },
    { cmd: "cto", path: "/cto-dashboard", label: "CTO Dashboard", category: "Enterprise" },
    { cmd: "compliance", path: "/compliance", label: "Compliance", category: "Enterprise" },
    { cmd: "due-diligence", path: "/due-diligence", label: "Due Diligence", category: "Enterprise" },
    { cmd: "living-docs", path: "/living-docs", label: "Living Docs", category: "Knowledge" },
    { cmd: "team-memory", path: "/team-memory", label: "Team Memory", category: "Knowledge" },
    { cmd: "decision", path: "/decision-explanation", label: "Decision Explainer", category: "Knowledge" },
  ]

  const publicNav = [
    { label: "Features", path: "/features" },
    { label: "Pricing", path: "/pricing" },
    { label: "About", path: "/about" },
  ]

  const isAdvancedRoute = advancedFeatures.some(f => location.pathname === f.path)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="container flex h-14 items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <span className="font-mono font-bold text-sm tracking-tight">
            <span className="text-primary">$</span> codeflow
          </span>
        </Link>

        {/* Command Navigation (Authenticated) */}
        {user ? (
          <div className="hidden md:flex items-center gap-1 font-mono text-xs">
            <span className="text-muted-foreground mr-1">~/</span>
            {navCommands.map((item, idx) => (
              <div key={item.path} className="flex items-center">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-border mx-0.5" />}
                <Link
                  to={item.path}
                  className={cn(
                    "px-2 py-1 rounded transition-colors hover:bg-muted/50",
                    location.pathname === item.path
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.cmd}
                </Link>
              </div>
            ))}
            
            {/* Advanced Features Dropdown */}
            <ChevronRight className="h-3 w-3 text-border mx-0.5" />
            <div 
              className="relative"
              onMouseEnter={() => setShowAdvanced(true)}
              onMouseLeave={() => setShowAdvanced(false)}
            >
              <button
                className={cn(
                  "px-2 py-1 rounded transition-colors hover:bg-muted/50 flex items-center gap-1",
                  isAdvancedRoute
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3" />
                <span>advanced</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* Dropdown Menu */}
              {showAdvanced && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-3 py-1 mono-xs text-muted-foreground border-b border-border mb-1">
                    Advanced Features
                  </div>
                  {advancedFeatures.map((feature) => (
                    <Link
                      key={feature.path}
                      to={feature.path}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors font-mono text-xs",
                        location.pathname === feature.path
                          ? "text-primary bg-primary/10"
                          : "text-foreground"
                      )}
                    >
                      <span>{feature.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {feature.category}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6 font-mono text-sm text-muted-foreground">
            {publicNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/profile">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 font-mono text-xs hover:bg-muted/50"
                >
                  {user.email?.split('@')[0] || 'user'}
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="h-8 font-mono text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                exit
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 font-mono text-xs hover:bg-muted/50"
                >
                  login
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  size="sm"
                  className="h-8 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
