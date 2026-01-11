/*
BILLION: Technical settings panel that feels like configuring a spacecraft.
DIRECTION: Functional / Dense / Clean
SIGNATURE: Toggle-heavy panel
*/

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Bell, Shield, Key } from "lucide-react"

export default function Settings() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and integrations.</p>
        </div>

        {/* Git Integrations */}
        <Card className="border-white/10 bg-card/40 backdrop-blur-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Github className="h-5 w-5" /> Source Control
              </CardTitle>
              <CardDescription>Manage your connections to GitHub, GitLab, or Bitbucket.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-black/20">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black">
                       <Github className="h-6 w-6" />
                    </div>
                    <div>
                       <div className="font-medium">GitHub</div>
                       <div className="text-xs text-green-500">Connected as @user</div>
                    </div>
                 </div>
                 <Button variant="outline" size="sm" className="border-red-500/20 text-red-500 hover:bg-red-500/10">Disconnect</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-black/20 opacity-50">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white">
                       <span className="font-bold">GitLab</span>
                    </div>
                    <div>
                       <div className="font-medium">GitLab</div>
                       <div className="text-xs text-muted-foreground">Not connected</div>
                    </div>
                 </div>
                 <Button variant="outline" size="sm">Connect</Button>
              </div>
           </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="border-white/10 bg-card/40 backdrop-blur-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Key className="h-5 w-5" /> API Access
              </CardTitle>
              <CardDescription>Manage API keys for CI/CD integration.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex gap-2">
                 <Input value="sk_live_512395812905812905812" readOnly className="bg-black/40 font-mono text-xs" />
                 <Button variant="secondary">Copy</Button>
                 <Button variant="destructive">Revoke</Button>
              </div>
              <p className="text-xs text-muted-foreground">Everyone with this key has admin access to your account.</p>
           </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-white/10 bg-card/40 backdrop-blur-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Bell className="h-5 w-5" /> Notifications
              </CardTitle>
              <CardDescription>Choose what we email you about.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              {[
                 "Analysis completed",
                 "Weekly summary",
                 "New features",
                 "Security alerts"
              ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm">{item}</span>
                    <div className="h-6 w-11 bg-primary rounded-full relative cursor-pointer">
                       <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                    </div>
                 </div>
              ))}
           </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                 <Shield className="h-5 w-5" /> Danger Zone
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                 <div>
                    <div className="font-medium text-red-200">Delete Account</div>
                    <div className="text-xs text-red-200/60">This action is irreversible. All data will be lost.</div>
                 </div>
                 <Button variant="destructive">Delete Account</Button>
              </div>
           </CardContent>
        </Card>

      </div>
    </div>
  )
}
