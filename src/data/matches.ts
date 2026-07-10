import { groups, groupTeams, type Group } from "./groups";
import { teamByCode, type Team } from "./teams";

export type MatchStatus = "scheduled" | "live" | "finished";
export type Stage =
  | "group"
  | "round-of-32"
  | "round-of-16"
  | "quarter-final"
  | "semi-final"
  | "third-place"
  | "final";

export type Match = {
  id: string;
  stage: Stage;
  group?: string;
  round: string; // ej. "Jornada 1", "Octavos", "Final"
  home: Team;
  away: Team;
  stadium: string;
  city: string;
  kickoff: string; // ISO
  status: MatchStatus;
  scoreHome?: number;
  scoreAway?: number;
};

// Sedes Mundial 2026 (16 ciudades)
const venues: { stadium: string; city: string }[] = [
  { stadium: "MetLife Stadium", city: "Nueva York" },
  { stadium: "SoFi Stadium", city: "Los Ángeles" },
  { stadium: "AT&T Stadium", city: "Dallas" },
  { stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  { stadium: "Lincoln Financial Field", city: "Filadelfia" },
  { stadium: "Hard Rock Stadium", city: "Miami" },
  { stadium: "Levi's Stadium", city: "San Francisco" },
  { stadium: "Lumen Field", city: "Seattle" },
  { stadium: "NRG Stadium", city: "Houston" },
  { stadium: "Arrowhead Stadium", city: "Kansas City" },
  { stadium: "Gillette Stadium", city: "Boston" },
  { stadium: "BMO Field", city: "Toronto" },
  { stadium: "BC Place", city: "Vancouver" },
  { stadium: "Estadio Azteca", city: "Ciudad de México" },
  { stadium: "Estadio Akron", city: "Guadalajara" },
  { stadium: "Estadio BBVA", city: "Monterrey" },
];

// Inicio del torneo: 11 de junio de 2026 (mock)
const TOURNAMENT_START = new Date("2026-06-11T17:00:00Z");

const isoFromOffset = (dayOffset: number, hour: number): string => {
  const d = new Date(TOURNAMENT_START);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

// Round-robin para grupo de 4 [a,b,c,d]:
// J1: a-b, c-d / J2: a-c, d-b / J3: a-d, b-c
const roundRobinPairs = (codes: string[]) => [
  {
    round: "Jornada 1",
    pairs: [
      [codes[0], codes[1]],
      [codes[2], codes[3]],
    ],
  },
  {
    round: "Jornada 2",
    pairs: [
      [codes[0], codes[2]],
      [codes[3], codes[1]],
    ],
  },
  {
    round: "Jornada 3",
    pairs: [
      [codes[0], codes[3]],
      [codes[1], codes[2]],
    ],
  },
];

const buildGroupStage = (): Match[] => {
  const out: Match[] = [];
  let venueIdx = 0;
  groups.forEach((g: Group, gi) => {
    const rounds = roundRobinPairs(g.teamCodes);
    rounds.forEach((r, ri) => {
      r.pairs.forEach((pair, pi) => {
        const dayOffset = (gi % 12) + ri * 4 + Math.floor(gi / 6); // dispersa partidos
        const hour = 17 + pi * 3; // 17h / 20h UTC
        const venue = venues[venueIdx % venues.length];
        venueIdx++;
        out.push({
          id: `G${g.name}-J${ri + 1}-${pi + 1}`,
          stage: "group",
          group: g.name,
          round: r.round,
          home: teamByCode(pair[0]),
          away: teamByCode(pair[1]),
          stadium: venue.stadium,
          city: venue.city,
          kickoff: isoFromOffset(dayOffset, hour),
          status: "scheduled",
        });
      });
    });
  });
  return out;
};

const tbd = (label: string): Team => ({
  code: "tbd",
  name: label,
  short: label,
  confederation: "UEFA",
});

const buildKnockout = (): Match[] => {
  const out: Match[] = [];
  let venueIdx = 0;
  const addStage = (
    stage: Stage,
    round: string,
    count: number,
    baseDay: number,
    labeler: (i: number) => [string, string],
  ) => {
    for (let i = 0; i < count; i++) {
      const venue = venues[venueIdx % venues.length];
      venueIdx++;
      const [h, a] = labeler(i);
      out.push({
        id: `${stage}-${i + 1}`,
        stage,
        round,
        home: tbd(h),
        away: tbd(a),
        stadium: venue.stadium,
        city: venue.city,
        kickoff: isoFromOffset(baseDay + Math.floor(i / 2), 17 + (i % 2) * 3),
        status: "scheduled",
      });
    }
  };

  // 32avos: 16 partidos (top 2 de cada grupo + 8 mejores terceros)
  const groupLetters = groups.map((g) => g.name);
  addStage("round-of-32", "Dieciseisavos", 16, 15, (i) => {
    const a = groupLetters[i % 12];
    const b = groupLetters[(i + 6) % 12];
    return [`1° Grupo ${a}`, `2° Grupo ${b}`];
  });
  addStage("round-of-16", "Octavos", 8, 22, (i) => [
    `Ganador 32-${i * 2 + 1}`,
    `Ganador 32-${i * 2 + 2}`,
  ]);
  addStage("quarter-final", "Cuartos", 4, 27, (i) => [
    `Ganador 16-${i * 2 + 1}`,
    `Ganador 16-${i * 2 + 2}`,
  ]);
  addStage("semi-final", "Semifinal", 2, 31, (i) => [
    `Ganador CF-${i * 2 + 1}`,
    `Ganador CF-${i * 2 + 2}`,
  ]);
  addStage("third-place", "Tercer Lugar", 1, 34, () => ["Perdedor SF-1", "Perdedor SF-2"]);
  addStage("final", "Final", 1, 35, () => ["Ganador SF-1", "Ganador SF-2"]);

  return out;
};

export const matches: Match[] = [...buildGroupStage(), ...buildKnockout()];

export const matchesByGroup = (groupName: string, list: Match[] = matches): Match[] =>
  list.filter((m) => m.group === groupName);

export const matchesByStage = (stage: Stage, list: Match[] = matches): Match[] =>
  list.filter((m) => m.stage === stage);

export const upcomingMatches = (limit?: number, list: Match[] = matches): Match[] => {
  const now = Date.now();
  const sorted = list
    .filter((m) => m.status === "scheduled" && new Date(m.kickoff).getTime() >= now)
    .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  return limit ? sorted.slice(0, limit) : sorted;
};

export const nextMatch = (list: Match[] = matches): Match => upcomingMatches(1, list)[0] ?? list[0];

// Helper: agrupar matches por día calendario
export const matchesByDay = (list: Match[]) => {
  const map = new Map<string, Match[]>();
  for (const m of list) {
    const key = new Date(m.kickoff).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
};
