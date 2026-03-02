import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Terminal, ChevronRight, ChevronDown, Sparkles, Menu, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"

export function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
    <nav className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/95 backdrop-blur-lg supports-backdrop-filter:bg-background/80">
      <div className="w-full px-4 md:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <motion.div 
              className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 group-hover:border-primary/60 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Terminal className="h-4 w-4 text-primary" />
            </motion.div>
            <span className="font-mono font-bold text-sm tracking-tight hidden sm:inline">
              <span className="text-primary">$</span> codeflow
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user ? (
            <div className="hidden md:flex items-center gap-0 font-mono text-xs flex-1 ml-8">
              <span className="text-muted-foreground mr-3">~/</span>
              <div className="flex items-center gap-0">
                {navCommands.map((item, idx) => (
                  <motion.div 
                    key={item.path} 
                    className="flex items-center"
                    whileHover={{ y: -2 }}
                  >
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-border/50 mx-0.5" />}
                    <Link
                      to={item.path}
                      className={cn(
                        "px-3 py-1.5 rounded-md transition-all duration-200",
                        location.pathname === item.path
                          ? "text-primary bg-primary/15 border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      {item.cmd}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Advanced Features Dropdown */}
                <ChevronRight className="h-3 w-3 text-border/50 mx-0.5" />
                <div 
                  className="relative"
                  onMouseEnter={() => setShowAdvanced(true)}
                  onMouseLeave={() => setShowAdvanced(false)}
                >
                  <motion.button
                    className={cn(
                      "px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1",
                      isAdvancedRoute
                        ? "text-primary bg-primary/15 border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                    whileHover={{ y: -2 }}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>advanced</span>
                    <motion.div
                      animate={{ rotate: showAdvanced ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div 
                        className="absolute top-full left-0 mt-2 w-56 bg-card border border-border/50 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="px-3 py-2 mono-xs text-muted-foreground border-b border-border/30 mb-1 font-semibold">
                          Advanced Features
                        </div>
                        {advancedFeatures.map((feature) => (
                          <Link
                            key={feature.path}
                            to={feature.path}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 hover:bg-accent/10 transition-colors font-mono text-xs",
                              location.pathname === feature.path
                                ? "text-primary bg-primary/15"
                                : "text-foreground"
                            )}
                          >
                            <span>{feature.label}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border/30 font-mono">
                              {feature.category}
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-8 font-mono text-sm text-muted-foreground flex-1 ml-8">
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
                    variant="minimal" 
                    size="sm" 
                    className="hidden sm:inline-flex h-8 font-mono text-xs"
                  >
                    {user.email?.split('@')[0] || 'user'}
                  </Button>
                </Link>
                <Button 
                  variant="minimal" 
                  size="sm"
                  onClick={logout}
                  className="hidden sm:inline-flex h-8 font-mono text-xs text-destructive/70 hover:text-destructive"
                >
                  exit
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 font-mono text-xs"
                  >
                    login
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
                  <Button 
                    size="sm"
                    className="h-8 font-mono text-xs"
                  >
                    register
                  </Button>
                </Link>
              </>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 hover:bg-muted/50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden border-t border-border/30 py-4 px-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1 font-mono text-xs">
                {user && navCommands.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md transition-colors",
                      location.pathname === item.path
                        ? "text-primary bg-primary/15"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.cmd}
                  </Link>
                ))}
                {!user && publicNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
