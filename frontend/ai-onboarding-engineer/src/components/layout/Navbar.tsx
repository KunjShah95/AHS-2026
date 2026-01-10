import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Code2, GitBranch, Layers, LayoutDashboard, Search } from "lucide-react"

export function Navbar() {
  const location = useLocation()
  
  const navItems = [
    { name: "Analysis", path: "/analysis", icon: Search },
    { name: "Roadmap", path: "/roadmap", icon: GitBranch },
    { name: "Architecture", path: "/architecture", icon: Layers },
    { name: "Tasks", path: "/tasks", icon: Code2 },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="mr-8 flex items-center space-x-2">
          <div className="flex items-center space-x-2 border border-primary/20 bg-primary/5 rounded-full px-3 py-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-xs font-medium tracking-wider text-primary uppercase">
              Cortex
            </span>
          </div>
        </Link>
        <div className="flex flex-1 items-center justify-center space-x-2">
          <nav className="flex items-center space-x-8 text-sm font-medium">
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
                <span className="hidden md:inline-block">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="absolute right-4 flex items-center space-x-2">
             <Button variant="default" size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/login">Login</Link>
            </Button>
             <Button variant="default" size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
