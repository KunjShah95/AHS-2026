/*
BILLION: Simple contact form.
DIRECTION: Functional
SIGNATURE: Contact
*/

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MapPin } from "lucide-react"

export default function Contact() {
  return (
    <div className="min-h-screen bg-background py-24 px-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12">
        
        <div className="space-y-8">
           <h1 className="text-4xl font-display font-medium">Get in touch.</h1>
           <p className="text-muted-foreground text-lg">
             Have questions about enterprise deployment? Need a custom integration? We'd love to hear from you.
           </p>

           <div className="space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                 <Mail className="h-5 w-5" />
                 <span>hello@cortex.ai</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                 <MapPin className="h-5 w-5" />
                 <span>San Francisco, CA</span>
              </div>
           </div>
        </div>

        <div className="p-8 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-sm">
           <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input placeholder="Jane" className="bg-black/20" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input placeholder="Doe" className="bg-black/20" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Email</label>
                 <Input type="email" placeholder="jane@company.com" className="bg-black/20" />
              </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Message</label>
                 <textarea 
                    className="w-full min-h-[120px] rounded-md border border-input bg-black/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Tell us what you need..." 
                 />
              </div>
              <Button size="lg" className="w-full">Send Message</Button>
           </form>
        </div>

      </div>
    </div>
  )
}
