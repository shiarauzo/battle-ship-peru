"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain } from "lucide-react"

const AI_MODELS = [
  // OpenAI Models
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", description: "Balanced performance with 1M context" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Latest OpenAI model with 400K context" },
  
  // Anthropic Models  
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", description: "Advanced reasoning with 200K context" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", description: "Fast responses with 200K context" },
  { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", description: "Powerful analysis with 200K context" },
  
  // Google Models
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash", description: "Ultra-fast with 1M context" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", description: "Advanced capabilities with 1M context" },
  
  // xAI Models
  { id: "xai/grok-code-fast-1", name: "Grok Code Fast", description: "Code-optimized strategy with 256K context" },
  { id: "xai/grok-4-fast-reasoning", name: "Grok 4 Fast", description: "Strategic reasoning with 2M context" },
  
  // Additional Model
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", description: "Balanced performance with 200K context" },
]

interface AISelectorProps {
  onStart: (model1: string, model2: string) => void
}

export function AISelector({ onStart }: AISelectorProps) {
  const [open, setOpen] = useState(true)
  const [model1, setModel1] = useState("")
  const [model2, setModel2] = useState("")

  const handleStart = () => {
    if (model1 && model2) {
      setOpen(false)
      setTimeout(() => onStart(model1, model2), 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] bg-card/95 border-primary/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-glow uppercase">
            <Brain className="h-6 w-6 text-primary" />[ BATTLESHIP AI ]
          </DialogTitle>
          <DialogDescription className="text-sm uppercase tracking-wide">
            Select two AI models to start battle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wide">&gt; PLAYER_01 - AI</label>
            <Select value={model1} onValueChange={setModel1}>
              <SelectTrigger className="w-full border-primary/30">
                <SelectValue placeholder="SELECT MODEL" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id} disabled={model.id === model2}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium uppercase">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wide">&gt; PLAYER_02 - AI</label>
            <Select value={model2} onValueChange={setModel2}>
              <SelectTrigger className="w-full border-primary/30">
                <SelectValue placeholder="SELECT MODEL" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id} disabled={model.id === model1}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium uppercase">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleStart}
            disabled={!model1 || !model2}
            className="w-full h-11 text-sm font-bold uppercase tracking-wider"
          >
            &gt;&gt; START BATTLE &lt;&lt;
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
