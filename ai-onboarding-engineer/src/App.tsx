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


// Advanced Features
import FlowTracer from "./pages/FlowTracer"
import TechDebtHeatmap from "./pages/TechDebtHeatmap"
import WhereShouldILook from "./pages/WhereShouldILook"
import LearningProgress from "./pages/LearningProgress"
import CTODashboard from "./pages/CTODashboard"
import CriticalPaths from "./pages/CriticalPaths"
import SkillGaps from "./pages/SkillGaps"
import OnboardingBenchmarks from "./pages/OnboardingBenchmarks"
import ProbationPredictor from "./pages/ProbationPredictor"
import ComplianceAudit from "./pages/ComplianceAudit"
import DueDiligence from "./pages/DueDiligence"
import LivingDocs from "./pages/LivingDocs"
import TeamMemory from "./pages/TeamMemory"
import DecisionExplanation from "./pages/DecisionExplanation"


import { AuthProvider } from "./context/AuthContext"

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

            {/* Advanced Features */}
            <Route path="flow-tracer" element={<FlowTracer />} />
            <Route path="tech-debt" element={<TechDebtHeatmap />} />
            <Route path="where-look" element={<WhereShouldILook />} />
            <Route path="learning-progress" element={<LearningProgress />} />
            <Route path="cto-dashboard" element={<CTODashboard />} />
            <Route path="critical-paths" element={<CriticalPaths />} />
            <Route path="skill-gaps" element={<SkillGaps />} />
            <Route path="benchmarks" element={<OnboardingBenchmarks />} />
            <Route path="probation" element={<ProbationPredictor />} />
            <Route path="compliance" element={<ComplianceAudit />} />
            <Route path="due-diligence" element={<DueDiligence />} />
            <Route path="living-docs" element={<LivingDocs />} />
            <Route path="team-memory" element={<TeamMemory />} />
            <Route path="decision-explanation" element={<DecisionExplanation />} />

            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Routes>
      </Router>

    </AuthProvider>
  )
}

export default App
