import { Outlet, Link, useLocation } from 'react-router-dom'
import { Zap, LayoutDashboard, GitBranch, Users, BarChart3, Settings, LogOut } from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/repositories', label: 'Repositories', icon: GitBranch },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const user = {
  name: 'Alex Johnson',
  avatar: 'AJ',
}

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[var(--text-primary)]">CodeGenome</span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            const Icon = item.icon
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--text-primary)] text-sm truncate">
                {user.name}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">View profile</div>
            </div>
            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[240px]">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}