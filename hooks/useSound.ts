import { useRef, useEffect, useCallback } from 'react'

export const useSound = (soundPath: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    audioRef.current = new Audio(soundPath)
    audioRef.current.volume = 0.3  //30% de volumen
  }, [soundPath])
  
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }, [])
  
  return { play }
}