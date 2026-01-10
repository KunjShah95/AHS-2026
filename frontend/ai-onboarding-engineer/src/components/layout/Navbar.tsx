import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Code2, GitBranch, Layers, LayoutDashboard, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  
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
        {/* Centered Navigation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
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
        </div>

        {/* Right Side Buttons */}
        <div className="ml-auto flex items-center space-x-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground mr-2 hidden md:block">{user.email}</span>
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
