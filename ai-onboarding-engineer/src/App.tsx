import { lazy, Suspense } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Analytics } from "@vercel/analytics/react"
import Layout from "./components/layout/Layout"
import { AuthProvider } from "./context/AuthContext"

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

// Core pages - Keep Landing eager for fast initial load
import Landing from "./pages/Landing"

// Lazy load all other pages for code splitting
const RepoAnalysis = lazy(() => import("./pages/RepoAnalysis"))
const Roadmap = lazy(() => import("./pages/Roadmap"))
const Architecture = lazy(() => import("./pages/Architecture"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Tasks = lazy(() => import("./pages/Tasks"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const Settings = lazy(() => import("./pages/Settings"))
const Profile = lazy(() => import("./pages/Profile"))
const Pricing = lazy(() => import("./pages/Pricing"))
const Features = lazy(() => import("./pages/Features"))
const About = lazy(() => import("./pages/About"))
const Contact = lazy(() => import("./pages/Contact"))
const Privacy = lazy(() => import("./pages/Privacy"))
const Terms = lazy(() => import("./pages/Terms"))
const Security = lazy(() => import("./pages/Security"))
const TokenEconomy = lazy(() => import("./pages/TokenEconomy"))
const TeamAnalytics = lazy(() => import("./pages/TeamAnalytics"))
const Quiz = lazy(() => import("./pages/Quiz"))
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"))
const Playbooks = lazy(() => import("./pages/Playbooks"))
const FirstPR = lazy(() => import("./pages/FirstPR"))

// Advanced Features - All lazy loaded
const FlowTracer = lazy(() => import("./pages/FlowTracer"))
const TechDebtHeatmap = lazy(() => import("./pages/TechDebtHeatmap"))
const WhereShouldILook = lazy(() => import("./pages/WhereShouldILook"))
const LearningProgress = lazy(() => import("./pages/LearningProgress"))
const CTODashboard = lazy(() => import("./pages/CTODashboard"))
const CriticalPaths = lazy(() => import("./pages/CriticalPaths"))
const SkillGaps = lazy(() => import("./pages/SkillGaps"))
const OnboardingBenchmarks = lazy(() => import("./pages/OnboardingBenchmarks"))
const ProbationPredictor = lazy(() => import("./pages/ProbationPredictor"))
const ComplianceAudit = lazy(() => import("./pages/ComplianceAudit"))
const DueDiligence = lazy(() => import("./pages/DueDiligence"))
const LivingDocs = lazy(() => import("./pages/LivingDocs"))
const TeamMemory = lazy(() => import("./pages/TeamMemory"))
const DecisionExplanation = lazy(() => import("./pages/DecisionExplanation"))

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Router>
      <Analytics />
    </AuthProvider>
  )
}

export default App
