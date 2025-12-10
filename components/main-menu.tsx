"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useClickSound } from "@/hooks/useClickSound"

interface MainMenuProps {
  onPlay: () => void
  onRanking: () => void
}

export function MainMenu({ onPlay, onRanking }: MainMenuProps) {
  const { playClick } = useClickSound()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="monitor-frame p-12 max-w-md w-full">
        <div className="text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-glow uppercase tracking-wider">
              Battle Ship
            </h1>
            <p className="text-muted-foreground uppercase text-sm tracking-widest">
              AI Model Combat Simulator
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => {
                playClick()
                onPlay()
              }}
              className="w-full text-lg font-bold uppercase tracking-wider h-14 bg-green-600 hover:bg-green-500 text-black"
            >
              [ Play ]
            </Button>
            
            <Button
              onClick={() => {
                playClick()
                onRanking()
              }}
              variant="outline"
              className="w-full text-lg font-bold uppercase tracking-wider h-14 border-green-600 text-green-400 hover:bg-green-950 hover:text-green-300"
            >
              [ Ranking ]
            </Button>
          </div>

          <div className="text-xs text-muted-foreground uppercase tracking-widest space-y-1">
            <p>Select AI Models</p>
            <p>Watch Them Battle</p>
            <p>View Statistics</p>
          </div>
        </div>
      </Card>
    </div>
  )
}