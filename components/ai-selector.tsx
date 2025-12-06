"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain } from "lucide-react"

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4", description: "Estrategia avanzada y análisis profundo" },
  { id: "claude", name: "Claude", description: "Pensamiento táctico estructurado" },
  { id: "gemini", name: "Gemini", description: "Predicción de patrones optimizada" },
  { id: "llama", name: "Llama", description: "Aprendizaje adaptativo rápido" },
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
            <Brain className="h-6 w-6 text-primary" />[ BATALLA NAVAL IA ]
          </DialogTitle>
          <DialogDescription className="text-sm uppercase tracking-wide">
            Selecciona dos modelos de IA para iniciar combate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wide">&gt; JUGADOR_01 - IA</label>
            <Select value={model1} onValueChange={setModel1}>
              <SelectTrigger className="w-full border-primary/30">
                <SelectValue placeholder="SELECCIONAR MODELO" />
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
            <label className="text-xs font-semibold text-primary uppercase tracking-wide">&gt; JUGADOR_02 - IA</label>
            <Select value={model2} onValueChange={setModel2}>
              <SelectTrigger className="w-full border-primary/30">
                <SelectValue placeholder="SELECCIONAR MODELO" />
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
            &gt;&gt; INICIAR COMBATE &lt;&lt;
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
