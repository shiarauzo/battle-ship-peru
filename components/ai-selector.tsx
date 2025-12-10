"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain } from "lucide-react"

const AI_MODELS = [
  // OpenAI
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },

  // Anthropic
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic' },

  // Google
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },

  // xAI
  { id: 'xai/grok-3', name: 'Grok 3', provider: 'xAI' },

  // Meta
  { id: 'meta/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta' },

  // DeepSeek
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },

  // Mistral
  { id: 'mistral/mistral-large', name: 'Mistral Large', provider: 'Mistral' },

  // Alibaba
  { id: 'alibaba/qwen3-max', name: 'Qwen 3 Max', provider: 'Alibaba' },

  // Perplexity
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', provider: 'Perplexity' },

  // Cohere
  { id: 'cohere/command-a', name: 'Command A', provider: 'Cohere' },

  // Amazon
  { id: 'amazon/nova-pro', name: 'Nova Pro', provider: 'Amazon' },

  // Moonshot
  { id: 'moonshot/kimi-k2', name: 'Kimi K2', provider: 'Moonshot' },

  // Zhipu
  { id: 'zhipu/glm-4.6', name: 'GLM 4.6', provider: 'Zhipu' },

  // MiniMax
  { id: 'minimax/minimax-m2', name: 'MiniMax M2', provider: 'MiniMax' },

  // Meituan
  { id: 'meituan/longcat-flash-thinking', name: 'Longcat Flash', provider: 'Meituan' },
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
              <SelectTrigger className="w-full border-primary/30" onClickSound={true}>
                <SelectValue placeholder="SELECT MODEL" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id} disabled={model.id === model2}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium uppercase">{model.name}</span>
                      
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wide">&gt; PLAYER_02 - AI</label>
            <Select value={model2} onValueChange={setModel2}>
              <SelectTrigger className="w-full border-primary/30" onClickSound={true}>
                <SelectValue placeholder="SELECT MODEL" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id} disabled={model.id === model1}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium uppercase">{model.name}</span>
                      
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleStart}
            onClickSound={true}
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
