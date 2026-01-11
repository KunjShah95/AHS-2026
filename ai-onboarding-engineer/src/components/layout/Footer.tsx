import { Brain, Github, FileText } from "lucide-react"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-black py-16 text-sm font-mono">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16">
            
            {/* Identity & Status */}
            <div className="space-y-6 max-w-sm">
                <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-bold tracking-tight">CodeFlow Research</span>
                </Link>
                <p className="text-muted-foreground/60 text-xs leading-relaxed">
                    Developing autonomous agents for semantic architectural analysis and knowledge preservation.
                    <br/>
                    Model: CF-2.4 (Context-Aware)
                </p>
                
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-green-400/90 tracking-wide uppercase">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Systems Operational
                </div>
            </div>

            {/* Technical Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
                
                <div className="space-y-4">
                    <h4 className="text-white/30 text-xs uppercase tracking-widest">Platform</h4>
                    <ul className="space-y-3 text-muted-foreground/60">
                        <li><Link to="/analysis" className="hover:text-primary transition-colors">Neural Analysis</Link></li>
                        <li><Link to="/architecture" className="hover:text-primary transition-colors">Knowledge Graph</Link></li>
                        <li><Link to="/features" className="hover:text-primary transition-colors">Context Engine</Link></li>
                        <li><Link to="/pricing" className="hover:text-primary transition-colors">Access Tiers</Link></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h4 className="text-white/30 text-xs uppercase tracking-widest">Research</h4>
                    <ul className="space-y-3 text-muted-foreground/60">
                         <li><Link to="/about" className="hover:text-primary transition-colors">Methodology</Link></li>
                         <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2">Whitepaper <FileText className="h-3 w-3 opacity-50"/></a></li>
                         <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                    </ul>
                </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-white/30 text-xs uppercase tracking-widest">Compliance</h4>
                    <ul className="space-y-3 text-muted-foreground/60">
                        <li><Link to="/privacy" className="hover:text-primary transition-colors">Data Privacy</Link></li>
                        <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        <li><Link to="/security" className="hover:text-primary transition-colors">SOC2 Report</Link></li>
                    </ul>
                </div>

            </div>
        </div>
        
        {/* Sub-footer */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-white/20 gap-4">
            <div>&copy; 2026 CodeFlow Intelligence Inc. All rights researched.</div>
            <div className="flex items-center gap-6">
                 <span className="hover:text-white/40 cursor-default">v2.4.0-beta</span>
                 <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors opacity-50 hover:opacity-100">
                    <Github className="h-4 w-4" />
                </a>
            </div>
        </div>
      </div>
    </footer>
  )
}
