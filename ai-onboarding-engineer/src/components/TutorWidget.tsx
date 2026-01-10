import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Send, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function TutorWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hi! I'm your codebase tutor. Ask me anything about the architecture or where to find things." }
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: "user", content: input }])
    
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "That's a great question about the codebase. Based on the analysis, you can find the logic for that in `src/lib/utils.ts`."
      }])
    }, 1000)
    
    setInput("")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96"
          >
            <Card className="border-primary/20 shadow-2xl shadow-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5 rounded-t-xl">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  AI Onboarding Tutor
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 h-80 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="p-2 pt-0">
                <div className="flex w-full items-center space-x-2">
                  <Input 
                    placeholder="Ask about the repo..." 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" onClick={handleSend}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 animate-bounce"
        variant={isOpen ? "secondary" : "default"}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  )
}
