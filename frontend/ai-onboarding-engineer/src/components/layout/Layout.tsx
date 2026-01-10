import { Outlet, useLocation } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"
import { TutorWidget } from "@/components/TutorWidget"

export default function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === "/"

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background gradients/blobs - removed for Landing as it has its own */}
      {!isLanding && (
        <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
           <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] animate-blob" />
        </div>
      )}
      
      <Navbar />
      <main className={`flex-1 w-full z-10 relative ${isLanding ? '' : 'max-w-7xl mx-auto px-4'}`}>
        <Outlet />
      </main>
      <Footer />
      <TutorWidget />
    </div>
  )
}
