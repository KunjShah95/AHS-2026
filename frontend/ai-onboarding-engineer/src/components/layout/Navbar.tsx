import React from "react"
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
          <Code2 className="h-6 w-6 text-primary animate-pulse" />
          <span className="hidden font-bold sm:inline-block">
            Onboarding<span className="text-primary">.ai</span>
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Optional search or other items */}
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                  location.pathname === item.path
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline-block">{item.name}</span>
              </Link>
            ))}
            <Button variant="shiny" size="sm" asChild>
              <Link to="/analysis">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </nav>
  )
}
