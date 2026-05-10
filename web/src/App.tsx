import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/toaster'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import RepoAnalysis from './pages/RepoAnalysis'
import FullAnalysis from './pages/FullAnalysis'
import Roadmap from './pages/Roadmap'
import Tasks from './pages/Tasks'
import CTODashboard from './pages/CTODashboard'
import TeamAnalytics from './pages/TeamAnalytics'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analysis" element={<RepoAnalysis />} />
            <Route path="full-analysis" element={<FullAnalysis />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="cto-dashboard" element={<CTODashboard />} />
            <Route path="team-analytics" element={<TeamAnalytics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App