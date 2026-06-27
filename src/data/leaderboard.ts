import { predictionsStore, calculateMatchPoints, isPredictionExact, isPredictionCorrect } from "@/lib/predictionsStore";
import { supabase } from "@/lib/supabase";
import { teams } from "@/data/teams";

const sortedTeamCodes = [...teams].map((t) => t.code).sort();

export type LeaderboardEntry = {
  rank: number;
  name: string;
  country: string; // flagcdn code
  points: number;
  accuracy: number;
  streak: number;
  isYou?: boolean;
  id?: string;
  exactCount?: number;
  correctCount?: number;
  championPick?: string | null;
  maxStreak?: number;
  predictions?: Record<string, { home: number; away: number }>;
};

const seed: Omit<LeaderboardEntry, "rank">[] = [
  { name: "Lucas Silva", country: "br", points: 1248, accuracy: 78, streak: 7 },
  { name: "Sofía Müller", country: "de", points: 1236, accuracy: 74, streak: 4 },
  { name: "Hiro Tanaka", country: "jp", points: 1224, accuracy: 71, streak: 5 },
  { name: "Emma Dubois", country: "fr", points: 1210, accuracy: 69, streak: 2 },
  { name: "Tú", country: "mx", points: 1198, accuracy: 67, streak: 3, isYou: true },
  { name: "Mateo Rossi", country: "it", points: 1191, accuracy: 65, streak: 1 },
  { name: "Olivia García", country: "es", points: 1184, accuracy: 63, streak: 0 },
  { name: "Ahmed Hassan", country: "eg", points: 1172, accuracy: 60, streak: 2 },
  { name: "Chen Wei", country: "cn", points: 1165, accuracy: 58, streak: 1 },
  { name: "Liam O'Connor", country: "ie", points: 1158, accuracy: 56, streak: 0 },
  { name: "Camila Torres", country: "ar", points: 1142, accuracy: 55, streak: 2 },
  { name: "Noah Andersson", country: "se", points: 1128, accuracy: 53, streak: 0 },
  { name: "Aya Benali", country: "ma", points: 1115, accuracy: 52, streak: 1 },
  { name: "Diego Suárez", country: "uy", points: 1101, accuracy: 51, streak: 3 },
  { name: "Min-jun Park", country: "kr", points: 1089, accuracy: 49, streak: 0 },
  { name: "Sara Novak", country: "hr", points: 1075, accuracy: 48, streak: 1 },
  { name: "Carlos Mendoza", country: "co", points: 1062, accuracy: 47, streak: 0 },
  { name: "Yara Haddad", country: "sa", points: 1048, accuracy: 46, streak: 2 },
  { name: "Tomás Pereira", country: "pt", points: 1031, accuracy: 44, streak: 0 },
  { name: "Isabella Rossi", country: "ch", points: 1018, accuracy: 43, streak: 1 },
];

export const leaderboard: LeaderboardEntry[] = seed
  .sort((a, b) => b.points - a.points)
  .map((entry, i) => ({ ...entry, rank: i + 1 }));

export const totalPredictors = 12438;

function getMockPrediction(playerName: string, matchId: string) {
  let hash = 0;
  const str = playerName + matchId;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const home = Math.abs(hash) % 4;
  const away = Math.abs(hash >> 2) % 4;
  return { home, away };
}

export function getDynamicLeaderboard(matchesList: any[]): LeaderboardEntry[] {
  const finished = matchesList.filter(m => m.status === "finished");
  if (finished.length === 0) {
    return leaderboard;
  }

  const userPredictions = predictionsStore.getAll();

  const entries = seed.map(player => {
    if (player.isYou) {
      let pts = 0;
      let correct = 0;
      let exact = 0;
      let finishedPreds = 0;

      for (const m of matchesList) {
        const pred = userPredictions[m.id];
        if (pred) {
          if (m.status === "finished") {
            finishedPreds++;
            const matchPts = calculateMatchPoints(m, pred);
            pts += matchPts;
            if (isPredictionExact(m, pred)) {
              exact++;
              correct++;
            } else if (isPredictionCorrect(m, pred)) {
              correct++;
            }
          }
        }
      }

      // Champion points
      const championCode = predictionsStore.getChampion();
      if (championCode) {
        const finalMatch = matchesList.find((m: any) => m.stage === "final");
        if (finalMatch && finalMatch.status === "finished" && finalMatch.scoreHome != null && finalMatch.scoreAway != null) {
          let winnerCode = "";
          if (finalMatch.scoreHome > finalMatch.scoreAway) {
            winnerCode = finalMatch.home.code;
          } else if (finalMatch.scoreAway > finalMatch.scoreHome) {
            winnerCode = finalMatch.away.code;
          }
          if (winnerCode === championCode) {
            pts += 20;
          }
        }
      }

      const accuracy = finishedPreds > 0 ? Math.round((correct / finishedPreds) * 100) : 0;

      return {
        ...player,
        points: pts,
        accuracy,
        streak: 0,
        id: "you",
        exactCount: exact,
        correctCount: Math.max(0, correct - exact),
        maxStreak: exact,
        championPick: championCode,
        predictions: userPredictions,
      };
    } else {
      let pts = 0;
      let correct = 0;
      let exact = 0;
      let finishedPreds = 0;
      const mockPreds: Record<string, { home: number; away: number }> = {};

      for (const m of matchesList) {
        if (m.status === "finished") {
          const pred = getMockPrediction(player.name, m.id);
          mockPreds[m.id] = pred;
          finishedPreds++;
          const matchPts = calculateMatchPoints(m, pred);
          pts += matchPts;
          if (isPredictionExact(m, pred)) {
            exact++;
            correct++;
          } else if (isPredictionCorrect(m, pred)) {
            correct++;
          }
        }
      }

      const accuracy = finishedPreds > 0 ? Math.round((correct / finishedPreds) * 100) : 0;

      return {
        ...player,
        points: pts,
        accuracy,
        streak: Math.min(5, Math.max(0, pts % 3)),
        id: `mock-${player.name}`,
        exactCount: exact,
        correctCount: Math.max(0, correct - exact),
        maxStreak: Math.max(Math.min(5, Math.max(0, pts % 3)), exact),
        championPick: player.country,
        predictions: mockPreds,
      };
    }
  });

  return entries
    .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || a.name.localeCompare(b.name))
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export async function getSupabaseLeaderboard(
  matchesList: any[],
  currentUserId?: string
): Promise<LeaderboardEntry[]> {
  try {
    const { data: dbProfiles, error: pError } = await supabase
      .from("profiles")
      .select("*");
    if (pError) throw pError;

    const { data: dbPredictions, error: predError } = await supabase
      .from("predictions")
      .select("*");
    if (predError) throw predError;

    // Filtrar para incluir únicamente al grupo original en el ranking global
    const ORIGINAL_USERNAMES = ["alexg3", "ghiuly", "eilyn", "gianna", "javiertroz"];
    const filteredProfiles = (dbProfiles || []).filter((p) => 
      ORIGINAL_USERNAMES.includes(p.username || "")
    );

    const realEntries: LeaderboardEntry[] = filteredProfiles.map((profile) => {
      const userPreds = (dbPredictions || []).filter((p) => p.user_id === profile.id);
      const predsRecord: Record<string, { home: number; away: number }> = {};
      userPreds.forEach((p) => {
        if (p.match_id !== "champion") {
          predsRecord[p.match_id] = { home: p.home_score, away: p.away_score };
        }
      });

      let pts = 0;
      let correct = 0;
      let exact = 0;
      let finishedPreds = 0;

      for (const m of matchesList) {
        const pred = userPreds.find((p) => p.match_id === m.id);
        if (pred) {
          if (m.status === "finished") {
            finishedPreds++;
            const matchPts = calculateMatchPoints(m, { home: pred.home_score, away: pred.away_score });
            pts += matchPts;
            if (pred.home_score === m.scoreHome && pred.away_score === m.scoreAway) {
              exact++;
              correct++;
            } else if (m.scoreHome !== undefined && m.scoreAway !== undefined) {
              const predOutcome = Math.sign(pred.home_score - pred.away_score);
              const realOutcome = Math.sign(m.scoreHome - m.scoreAway);
              if (predOutcome === realOutcome) {
                correct++;
              }
            }
          }
        }
      }

      // Puntos por acertar el campeón
      const dbChampionRow = userPreds.find((p) => p.match_id === "champion");
      let championCode = null;
      if (dbChampionRow) {
        championCode = sortedTeamCodes[dbChampionRow.home_score] || null;
      }
      if (!championCode && profile.id === currentUserId) {
        const localChampion = predictionsStore.getChampion();
        if (localChampion) {
          championCode = localChampion;
        }
      }

      const finalMatch = matchesList.find((m: any) => m.stage === "final");
      if (finalMatch && finalMatch.status === "finished" && finalMatch.scoreHome != null && finalMatch.scoreAway != null) {
        let winnerCode = "";
        if (finalMatch.scoreHome > finalMatch.scoreAway) {
          winnerCode = finalMatch.home.code;
        } else if (finalMatch.scoreAway > finalMatch.scoreHome) {
          winnerCode = finalMatch.away.code;
        }
        if (winnerCode && winnerCode === championCode) {
          pts += 20;
        }
      }

      const accuracy = finishedPreds > 0 ? Math.round((correct / finishedPreds) * 100) : 0;

      // Calcular racha activa y racha máxima de marcadores exactos
      const finishedMatches = [...matchesList]
        .filter((m) => m.status === "finished")
        .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());

      let streak = 0;
      for (const m of finishedMatches) {
        const pred = userPreds.find((p) => p.match_id === m.id);
        if (pred) {
          if (pred.home_score === m.scoreHome && pred.away_score === m.scoreAway) {
            streak++;
          } else {
            // Predicción incorrecta o no exacta rompe la racha
            break;
          }
        }
      }

      let maxStreak = 0;
      let tempStreak = 0;
      const chronoMatches = [...finishedMatches]
        .sort((a, b) => new Date(a.date || "").getTime() - new Date(b.date || "").getTime());
        
      for (const m of chronoMatches) {
        const pred = userPreds.find((p) => p.match_id === m.id);
        if (pred) {
          if (pred.home_score === m.scoreHome && pred.away_score === m.scoreAway) {
            tempStreak++;
            if (tempStreak > maxStreak) {
              maxStreak = tempStreak;
            }
          } else {
            tempStreak = 0;
          }
        }
      }

      return {
        rank: 0,
        name: profile.full_name || profile.username,
        country: profile.country_code || "cr",
        points: pts,
        accuracy,
        streak,
        isYou: profile.id === currentUserId,
        id: profile.id,
        exactCount: exact,
        correctCount: Math.max(0, correct - exact),
        maxStreak: maxStreak,
        championPick: championCode,
        predictions: predsRecord,
      };
    });

    return realEntries
      .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || a.name.localeCompare(b.name))
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

  } catch (err) {
    console.error("Error al calcular ranking de Supabase:", err);
    return getDynamicLeaderboard(matchesList);
  }
}

export async function getOtherPrizesStatus(matchesList: any[]): Promise<{
  firstGoalWinner: { name: string; country: string } | null;
  hatTrickWinners: { name: string; country: string; maxStreak: number }[];
}> {
  try {
    // 1. Obtener el primer pronóstico registrado
    const { data: firstPreds, error: fpError } = await supabase
      .from("predictions")
      .select("user_id")
      .order("created_at", { ascending: true })
      .limit(1);

    let firstGoalWinner = null;
    if (!fpError && firstPreds && firstPreds.length > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, country_code")
        .eq("id", firstPreds[0].user_id)
        .single();
      if (profile) {
        firstGoalWinner = {
          name: profile.full_name || profile.username,
          country: profile.country_code || "cr",
        };
      }
    }

    // 2. Obtener ganadores del logro Hat-Trick (maxStreak >= 3)
    const { data: dbProfiles, error: pError } = await supabase.from("profiles").select("*");
    const { data: dbPredictions, error: predError } = await supabase.from("predictions").select("*");

    const hatTrickWinners: { name: string; country: string; maxStreak: number }[] = [];

    if (!pError && !predError && dbProfiles && dbPredictions) {
      const finishedMatches = matchesList.filter((m) => m.status === "finished");
      
      dbProfiles.forEach((profile) => {
        const userPreds = dbPredictions.filter((p) => p.user_id === profile.id);
        
        // Calcular racha máxima
        let maxStreak = 0;
        let currentStreak = 0;
        const chronoMatches = [...finishedMatches]
          .sort((a, b) => new Date(a.date || "").getTime() - new Date(b.date || "").getTime());
          
        for (const m of chronoMatches) {
          const pred = userPreds.find((p) => p.match_id === m.id);
          if (pred) {
            if (pred.home_score === m.scoreHome && pred.away_score === m.scoreAway) {
              currentStreak++;
              if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
              }
            } else {
              currentStreak = 0;
            }
          }
        }

        if (maxStreak >= 3) {
          hatTrickWinners.push({
            name: profile.full_name || profile.username,
            country: profile.country_code || "cr",
            maxStreak,
          });
        }
      });
    }

    return {
      firstGoalWinner,
      hatTrickWinners: hatTrickWinners.sort((a, b) => b.maxStreak - a.maxStreak),
    };
  } catch (err) {
    console.error("Error al obtener estado de otros premios:", err);
    return { firstGoalWinner: null, hatTrickWinners: [] };
  }
}

