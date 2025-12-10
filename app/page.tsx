"use client"

import { useState } from "react"
import { AISelector } from "@/components/ai-selector"
import { BattleField } from "@/components/battle-field"
import { MainMenu } from "@/components/main-menu"
import { Ranking } from "@/components/ranking"

type View = "menu" | "play" | "ranking" | "game"


export default function Home() {
  const [currentView, setCurrentView] = useState<View>("menu")
  const [aiModel1, setAIModel1] = useState("")
  const [aiModel2, setAIModel2] = useState("")

  const handleStartGame = (model1: string, model2: string) => {
    setAIModel1(model1)
    setAIModel2(model2)
    setCurrentView("game")
  }

  const handleBackToMenu = () => {
    setCurrentView("menu")
    setAIModel1("")
    setAIModel2("")
  }

  const handlePlay = () => {
    setCurrentView("play")
  }

  const handleRanking = () => {
    setCurrentView("ranking")
  }

  return (
    <main className="min-h-screen bg-background">
      {currentView === "menu" && (
        <MainMenu onPlay={handlePlay} onRanking={handleRanking} />
      )}
      {currentView === "play" && (
        <AISelector onStart={handleStartGame} onBack={handleBackToMenu} />
      )}
      {currentView === "ranking" && (
        <Ranking onBack={handleBackToMenu} />
      )}
      {currentView === "game" && (
        <BattleField 
          aiModel1={aiModel1} 
          aiModel2={aiModel2} 
          onBackToMenu={handleBackToMenu}
        />
      )}
    </main>
  )
}