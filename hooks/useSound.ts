import { useState, useEffect, useCallback } from 'react'

export const useSound = (soundPath: string) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    const audioElement = new Audio(soundPath)
    audioElement.volume = 0.3 // 30% volume as requested
    setAudio(audioElement)
  }, [soundPath])
  
  const play = useCallback(() => {
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(console.error)
    }
  }, [audio])
  
  return { play }
}