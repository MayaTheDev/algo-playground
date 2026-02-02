import { useState, useEffect, useRef, useCallback } from 'react'

export function useAlgoPlayer<T>(steps: T[]) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!playing) { clearTimer(); return }

    intervalRef.current = setInterval(() => {
      setIdx(prev => {
        if (prev >= steps.length - 1) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, speed)

    return clearTimer
  }, [playing, speed, steps.length])

  const play = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])

  const stepForward = useCallback(() => {
    setPlaying(false)
    setIdx(prev => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const reset = useCallback(() => {
    setPlaying(false)
    setIdx(0)
  }, [])

  return {
    currentStep: steps[idx] ?? steps[0],
    idx,
    total: steps.length,
    playing,
    speed,
    play,
    pause,
    stepForward,
    reset,
    setSpeed,
    isDone: idx >= steps.length - 1,
  }
}
