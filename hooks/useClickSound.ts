import { useSound } from "./useSound"

export const useClickSound = () => {
  const { play } = useSound('/sounds/click.mp3')
  return { playClick: play }
}