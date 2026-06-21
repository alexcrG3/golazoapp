import { useEffect, useState } from "react";

export type ScorePrediction = { home: number; away: number };

const KEY_PREDICTIONS = "golazo:predictions";
const KEY_CHAMPION = "golazo:champion";

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, val: unknown) => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

export const predictionsStore = {
  getAll(): Record<string, ScorePrediction> {
    return read<Record<string, ScorePrediction>>(KEY_PREDICTIONS, {});
  },
  get(matchId: string): ScorePrediction | undefined {
    return this.getAll()[matchId];
  },
  set(matchId: string, p: ScorePrediction) {
    const all = this.getAll();
    all[matchId] = p;
    write(KEY_PREDICTIONS, all);
    notify();
  },
  setAll(preds: Record<string, ScorePrediction>) {
    write(KEY_PREDICTIONS, preds);
    notify();
  },
  clear() {
    write(KEY_PREDICTIONS, {});
    write(KEY_CHAMPION, null);
    notify();
  },
  getChampion(): string | null {
    return read<string | null>(KEY_CHAMPION, null);
  },
  setChampion(code: string | null) {
    write(KEY_CHAMPION, code);
    notify();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

export function usePrediction(matchId: string) {
  const [, setTick] = useState(0);
  useEffect(() => predictionsStore.subscribe(() => setTick((t) => t + 1)), []);
  return predictionsStore.get(matchId);
}

export function useChampion() {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    setCode(predictionsStore.getChampion());
    return predictionsStore.subscribe(() => setCode(predictionsStore.getChampion()));
  }, []);
  return code;
}

export function calculateMatchPoints(
  match: { stage: string; status: string; scoreHome?: number; scoreAway?: number },
  pred: { home: number; away: number } | undefined
): number {
  if (!pred || match.status !== "finished" || match.scoreHome == null || match.scoreAway == null) {
    return 0;
  }
  const isKnockout = match.stage !== "group";
  const exact = pred.home === match.scoreHome && pred.away === match.scoreAway;
  if (exact) {
    return isKnockout ? 5 : 3;
  }
  const predOutcome = Math.sign(pred.home - pred.away);
  const realOutcome = Math.sign(match.scoreHome - match.scoreAway);
  if (predOutcome === realOutcome) {
    return isKnockout ? 3 : 1;
  }
  return 0;
}

export function isPredictionCorrect(
  match: { status: string; scoreHome?: number; scoreAway?: number },
  pred: { home: number; away: number } | undefined
): boolean {
  if (!pred || match.status !== "finished" || match.scoreHome == null || match.scoreAway == null) {
    return false;
  }
  const predOutcome = Math.sign(pred.home - pred.away);
  const realOutcome = Math.sign(match.scoreHome - match.scoreAway);
  return predOutcome === realOutcome;
}

export function isPredictionExact(
  match: { status: string; scoreHome?: number; scoreAway?: number },
  pred: { home: number; away: number } | undefined
): boolean {
  if (!pred || match.status !== "finished" || match.scoreHome == null || match.scoreAway == null) {
    return false;
  }
  return pred.home === match.scoreHome && pred.away === match.scoreAway;
}

export function calculateUserStats(matches: any[], fallbackChampionCode?: string | null) {
  const predictions = predictionsStore.getAll();
  let totalPredictions = 0;
  let correct = 0;
  let exact = 0;
  let points = 0;

  for (const m of matches) {
    const pred = predictions[m.id];
    if (pred) {
      totalPredictions++;
      if (m.status === "finished") {
        const pts = calculateMatchPoints(m, pred);
        points += pts;
        if (isPredictionExact(m, pred)) {
          exact++;
          correct++;
        } else if (isPredictionCorrect(m, pred)) {
          correct++;
        }
      }
    }
  }

  // Puntos por acertar el campeón (si la final terminó)
  const championCode = predictionsStore.getChampion() || fallbackChampionCode;
  if (championCode) {
    const finalMatch = matches.find((m: any) => m.stage === "final");
    if (finalMatch && finalMatch.status === "finished" && finalMatch.scoreHome != null && finalMatch.scoreAway != null) {
      let winnerCode = "";
      if (finalMatch.scoreHome > finalMatch.scoreAway) {
        winnerCode = finalMatch.home.code;
      } else if (finalMatch.scoreAway > finalMatch.scoreHome) {
        winnerCode = finalMatch.away.code;
      }
      if (winnerCode && winnerCode === championCode) {
        points += 20;
      }
    }
  }

  const finishedPredictionsCount = matches.filter(m => m.status === "finished" && predictions[m.id]).length;
  const accuracy = finishedPredictionsCount > 0 ? Math.round((correct / finishedPredictionsCount) * 100) : 0;

  return {
    predictions: totalPredictions,
    correct,
    exact,
    accuracy,
    points,
  };
}

