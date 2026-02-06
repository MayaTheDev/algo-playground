import { useState, useEffect, useRef, useCallback } from 'react'
import type { SortStep } from '../types/algo.types'

export function useComparePlayer(stepsA: SortStep[], stepsB: SortStep[]) {
  const [idxA, setIdxA] = useState(0)
  const [idxB, setIdxB] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doneA = idxA >= stepsA.length - 1
  const doneB = idxB >= stepsB.length - 1
  const isDone = doneA && doneB

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  useEffect(() => {
    if (!playing) { clearTimer(); return }
    if (isDone) { setPlaying(false); return }

    timerRef.current = setInterval(() => {
      setIdxA(prev => Math.min(prev + 1, stepsA.length - 1))
      setIdxB(prev => Math.min(prev + 1, stepsB.length - 1))
    }, speed)

    return clearTimer
  }, [playing, speed, stepsA.length, stepsB.length, isDone])

  const play = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  const reset = useCallback(() => { setPlaying(false); setIdxA(0); setIdxB(0) }, [])

  return {
    stepA: stepsA[idxA] ?? stepsA[0],
    stepB: stepsB[idxB] ?? stepsB[0],
    idxA, idxB,
    totalA: stepsA.length,
    totalB: stepsB.length,
    doneA, doneB, isDone,
    playing, speed,
    play, pause, reset, setSpeed,
  }
}
