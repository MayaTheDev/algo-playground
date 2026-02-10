import type { DpStep } from '../../types/algo.types'

const DEFAULT_COINS = [1, 3, 4]

/** Generate a random target amount */
export function generateTarget(): { coins: number[]; amount: number } {
  const amount = Math.floor(Math.random() * 8) + 6
  return { coins: DEFAULT_COINS, amount }
}

/** Bottom-up DP coin change — yields each step */
export function* coinChangeSteps(
  coins: number[],
  amount: number,
): Generator<DpStep> {
  const dp = Array(amount + 1).fill(Infinity)
  dp[0] = 0
  const usedCoin: number[] = Array(amount + 1).fill(-1)

  yield {
    table: [...dp],
    current: 0,
    comparing: null,
    filled: [0],
    coins,
    amount,
    description: `Initialize dp table. dp[0] = 0, all others = Infinity.`,
  }

  const filled: number[] = [0]

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      const candidate = dp[i - coin] + 1

      yield {
        table: [...dp],
        current: i,
        comparing: [i - coin, i],
        filled: [...filled],
        coins,
        amount,
        description: `Coin ${coin}: dp[${i}] = min(dp[${i}]=${dp[i] === Infinity ? '∞' : dp[i]}, dp[${i - coin}]+1=${candidate === Infinity ? '∞' : candidate})`,
      }

      if (candidate < dp[i]) {
        dp[i] = candidate
        usedCoin[i] = coin

        if (!filled.includes(i)) filled.push(i)

        yield {
          table: [...dp],
          current: i,
          comparing: null,
          filled: [...filled],
          coins,
          amount,
          description: `Update dp[${i}] = ${dp[i]} (used coin ${coin}).`,
        }
      }
    }
  }

  yield {
    table: [...dp],
    current: amount,
    comparing: null,
    filled: [...filled],
    coins,
    amount,
    description: dp[amount] === Infinity
      ? `No solution for amount ${amount}.`
      : `Done! Minimum coins for ${amount} = ${dp[amount]}.`,
  }
}
