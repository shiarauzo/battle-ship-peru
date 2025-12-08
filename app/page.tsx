"use client"

import { useState } from "react"
import { AISelector } from "@/components/ai-selector"
import { BattleField } from "@/components/battle-field"


export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [aiModel1, setAIModel1] = useState("")
  const [aiModel2, setAIModel2] = useState("")

  const handleStartGame = (model1: string, model2: string) => {
    setAIModel1(model1)
    setAIModel2(model2)
    setGameStarted(true)
  }

  return (
    <div className="container mx-auto py-8">
      {!gameStarted ? (
        <AISelector onStart={handleStartGame} />
      ) : (
        <BattleField aiModel1={aiModel1} aiModel2={aiModel2} />
      )}
    </div>
  )
}
