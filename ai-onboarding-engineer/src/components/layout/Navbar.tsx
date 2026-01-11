import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Code2, GitBranch, Layers, LayoutDashboard, Search, Settings as SettingsIcon, Brain, Zap, Users, BookOpen, FileText, Rocket, BrainCircuit } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const navItems = [
    { name: "Analysis", path: "/analysis", icon: Search },
    { name: "Roadmap", path: "/roadmap", icon: GitBranch },
    { name: "Architecture", path: "/architecture", icon: Layers },
    { name: "Tasks", path: "/tasks", icon: Code2 },
    { name: "Tokens", path: "/token-economy", icon: Zap },
    { name: "Team", path: "/team-analytics", icon: Users },
    { name: "Quiz", path: "/quiz", icon: BrainCircuit },
    { name: "Knowledge", path: "/knowledge", icon: BookOpen },
    { name: "Playbooks", path: "/playbooks", icon: FileText },
    { name: "First PR", path: "/first-pr", icon: Rocket },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="mr-8 flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
             <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            CodeFlow
          </span>
        </Link>
        {/* Centered Navigation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
           {user ? (
             <nav className="flex items-center space-x-6 text-sm font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 transition-colors hover:text-primary",
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
           ) : (
             <nav className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
                <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
                <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
             </nav>
           )}
        </div>

        {/* Right Side Buttons */}
        <div className="ml-auto flex items-center space-x-2">

          {user ? (
            <>
              <div className="flex items-center gap-2 mr-2">
                 <Button variant="ghost" size="icon" asChild title="Profile">
                    <Link to="/profile">
                       <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {user.email?.charAt(0).toUpperCase()}
                       </div>
                    </Link>
                 </Button>
                 <Button variant="ghost" size="icon" asChild title="Settings">
                    <Link to="/settings">
                       <SettingsIcon className="h-4 w-4" />
                    </Link>
                 </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-primary/10 text-primary">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
