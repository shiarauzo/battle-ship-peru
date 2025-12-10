"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, ArrowLeft } from "lucide-react"
import { useClickSound } from "@/hooks/useClickSound"

const AI_MODELS = [
  // OpenAI
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  
  // Anthropic
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  
  // Google
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
  
  // Meta
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta' },
  
  // Mistral
  { id: 'mistral/mistral-large-latest', name: 'Mistral Large', provider: 'Mistral' },
]

interface AISelectorProps {
  onStart: (model1: string, model2: string) => void
  onBack: () => void
}

export function AISelector({ onStart, onBack }: AISelectorProps) {
  const [model1, setModel1] = useState("")
  const [model2, setModel2] = useState("")
  const { playClick } = useClickSound()

  const handleStart = () => {
    if (model1 && model2) {
      onStart(model1, model2)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="monitor-frame p-8 max-w-2xl w-full">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-8 w-8 text-green-400" />
              <h1 className="text-3xl font-bold text-glow uppercase tracking-wider">
                [ BATTLESHIP AI ]
              </h1>
            </div>
            <p className="text-muted-foreground uppercase tracking-wide text-sm">
              Select two AI models to start battle
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                &gt; PLAYER_01 - AI
              </label>
              <Select value={model1} onValueChange={setModel1}>
                <SelectTrigger className="w-full border-green-600/30">
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
              <label className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                &gt; PLAYER_02 - AI
              </label>
              <Select value={model2} onValueChange={setModel2}>
                <SelectTrigger className="w-full border-green-600/30">
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
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleStart}
              disabled={!model1 || !model2}
              className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-green-600 hover:bg-green-500 text-black"
            >
              &gt;&gt; START BATTLE &lt;&lt;
            </Button>
            
            <Button
              onClick={() => {
                playClick()
                onBack()
              }}
              variant="outline"
              className="w-full h-10 font-bold uppercase tracking-wider border-green-600 text-green-400 hover:bg-green-950"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
