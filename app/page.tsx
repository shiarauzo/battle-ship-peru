"use client";

import { useState } from "react";
import { AISelector } from "@/components/ai-selector";
import { BattleField } from "@/components/battle-field";
import { Ranking } from "@/components/ranking";

type View = "play" | "ranking" | "game";

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("play");
  const [aiModel1, setAIModel1] = useState("");
  const [aiModel2, setAIModel2] = useState("");

  const handleStartGame = (model1: string, model2: string) => {
    setAIModel1(model1);
    setAIModel2(model2);
    setCurrentView("game");
  };

  const handleBackToSelector = () => {
    setCurrentView("play");
    setAIModel1("");
    setAIModel2("");
  };

  const handleRanking = () => {
    setCurrentView("ranking");
  };

  return (
    <main className="min-h-screen bg-background">
      {currentView === "play" && (
        <AISelector onStart={handleStartGame} onRanking={handleRanking} />
      )}
      {currentView === "ranking" && <Ranking onBack={handleBackToSelector} />}
      {currentView === "game" && (
        <BattleField
          aiModel1={aiModel1}
          aiModel2={aiModel2}
          onBackToMenu={handleBackToSelector}
        />
      )}
    </main>
  );
}
