/*
BILLION: Security & Compliance Documentation.
DIRECTION: Technical / Reassuring
SIGNATURE: Security
*/

import { Shield, Lock, FileKey, Server } from "lucide-react"

export default function Security() {
  return (
    <div className="min-h-screen bg-background py-24 px-6 md:px-12 max-w-5xl mx-auto">
       <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-6">
                <Shield className="h-3 w-3" />
                <span>Security First Architecture</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-medium mb-6">
                Your IP is your lifeblood.<br/>
                We treat it that way.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                We designed CodeFlow from the ground up to operate in zero-trust environments. 
                We don't train our models on your code. We don't store your source files.
            </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div className="p-8 rounded-2xl border border-white/10 bg-card/20 backdrop-blur-sm">
                <Lock className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Ephemeral Processing</h3>
                <p className="text-muted-foreground leading-relaxed">
                    When analyzing a repo, we clone it to an ephemeral, isolated container. 
                    Once vector embeddings are generated, the container is destroyed. 
                    Your raw code never touches a persistent disk.
                </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/10 bg-card/20 backdrop-blur-sm">
                <FileKey className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">SOC 2 Type II Compliant</h3>
                <p className="text-muted-foreground leading-relaxed">
                   We undergo annual audits to ensure our controls meet the highest standards for security, availability, and confidentiality. 
                   <a href="#" className="text-primary hover:underline ml-1">Request Report &rarr;</a>
                </p>
            </div>

            <div className="p-8 rounded-2xl border border-white/10 bg-card/20 backdrop-blur-sm">
                <Server className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Data Residency</h3>
                <p className="text-muted-foreground leading-relaxed">
                    Enterprise customers can choose where their vector data is stored (US, EU, or APAC regions) to satisfy GDPR and CCPA requirements.
                </p>
            </div>
       </div>

       <div className="border-t border-white/10 pt-16">
           <h2 className="text-2xl font-semibold mb-8">Infrastructure Security</h2>
           <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm text-muted-foreground">
               <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                   Encryption at Rest (AES-256)
               </li>
               <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                   Encryption in Transit (TLS 1.3)
               </li>
               <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                   Strict Least-Privilege Access
               </li>
               <li className="flex items-center gap-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                   Automated Vulnerability Scanning
               </li>
           </ul>
       </div>
    </div>
  )
}
