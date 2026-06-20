import { teamByCode } from "./teams";
import { leaderboard } from "./leaderboard";

const you = leaderboard.find((p) => p.isYou)!;

export const userProfile = {
  name: you.name,
  handle: "@golazo_tu",
  country: teamByCode(you.country),
  joined: "Fase de Grupos 2026",
  stats: {
    predictions: 24,
    correct: 16,
    exact: 6,
    accuracy: you.accuracy,
    rank: you.rank,
    points: you.points,
  },
  achievements: [
    { id: "a1", name: "Primer Gol", desc: "Hiciste tu primera predicción", icon: "⚽" },
    { id: "a2", name: "Hat-Trick", desc: "3 marcadores exactos seguidos", icon: "🎯" },
    { id: "a3", name: "Top 10", desc: "Llegaste al top 10 global", icon: "🏆" },
    { id: "a4", name: "Racha x5", desc: "5 predicciones correctas seguidas", icon: "🔥" },
  ],
};
