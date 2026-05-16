import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="container">
      <nav className="nav">
        <NavLink to="/">CodeGenome</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/tasks">Tasks</NavLink>
        <NavLink to="/roadmap">Roadmap</NavLink>
        <NavLink to="/team">Team</NavLink>
        <NavLink to="/cto">CTO</NavLink>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </div>
      </nav>
      <main style={{ padding: '2rem 0' }}>
        <Outlet />
      </main>
    </div>
  )
}