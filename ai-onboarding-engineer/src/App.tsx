import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
import Landing from "./pages/Landing"
import RepoAnalysis from "./pages/RepoAnalysis"
import Roadmap from "./pages/Roadmap"
import Architecture from "./pages/Architecture"
import Dashboard from "./pages/Dashboard"
import Tasks from "./pages/Tasks"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Settings from "./pages/Settings"
import Profile from "./pages/Profile"
import Pricing from "./pages/Pricing"
import Features from "./pages/Features"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import Security from "./pages/Security"
import TokenEconomy from "./pages/TokenEconomy"
import TeamAnalytics from "./pages/TeamAnalytics"
import Quiz from "./pages/Quiz"
import KnowledgeBase from "./pages/KnowledgeBase"
import Playbooks from "./pages/Playbooks"
import FirstPR from "./pages/FirstPR"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="analysis" element={<RepoAnalysis />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="architecture" element={<Architecture />} />
            <Route path="tasks" element={<Tasks />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="features" element={<Features />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="security" element={<Security />} />
            <Route path="token-economy" element={<TokenEconomy />} />
            <Route path="team-analytics" element={<TeamAnalytics />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="playbooks" element={<Playbooks />} />
            <Route path="first-pr" element={<FirstPR />} />

            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </Router>
      )
}

      export default App
