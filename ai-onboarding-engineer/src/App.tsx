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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="analysis" element={<RepoAnalysis />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="tasks" element={<Tasks />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
