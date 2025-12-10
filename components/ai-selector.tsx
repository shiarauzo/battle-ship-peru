"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, ArrowLeft } from "lucide-react"
import { useClickSound } from "@/hooks/useClickSound"

const AI_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'xai/grok-3', name: 'Grok 3', provider: 'xAI' },
  { id: 'meta/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'mistral/mistral-large', name: 'Mistral Large', provider: 'Mistral' },
  { id: 'alibaba/qwen3-max', name: 'Qwen 3 Max', provider: 'Alibaba' },
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', provider: 'Perplexity' },
  { id: 'cohere/command-a', name: 'Command A', provider: 'Cohere' },
  { id: 'amazon/nova-pro', name: 'Nova Pro', provider: 'Amazon' },
  { id: 'moonshot/kimi-k2', name: 'Kimi K2', provider: 'Moonshot' },
  { id: 'zhipu/glm-4.6', name: 'GLM 4.6', provider: 'Zhipu' },
  { id: 'minimax/minimax-m2', name: 'MiniMax M2', provider: 'MiniMax' },
  { id: 'meituan/longcat-flash-thinking', name: 'Longcat Flash', provider: 'Meituan' },
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
                      <span className="font-medium uppercase">{model.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({model.provider})</span>
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
                      <span className="font-medium uppercase">{model.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({model.provider})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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