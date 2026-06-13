import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import FullAnalysis from './pages/FullAnalysis'
import RepoAnalysis from './pages/RepoAnalysis'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import Tasks from './pages/Tasks'
import Roadmap from './pages/Roadmap'
import TeamAnalytics from './pages/TeamAnalytics'
import CTODashboard from './pages/CTODashboard'
import ExplorePage from './pages/ExplorePage'
import LearnPage from './pages/LearnPage'
import FirstIssuePage from './pages/FirstIssuePage'
import AskPage from './pages/AskPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analysis/:owner/:repo" element={<FullAnalysis />} />
          <Route path="repo/:owner/:repo" element={<RepoAnalysis />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="team" element={<TeamAnalytics />} />
          <Route path="cto" element={<CTODashboard />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="first-issue" element={<FirstIssuePage />} />
          <Route path="ask" element={<AskPage />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}