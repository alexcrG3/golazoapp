import { groups as staticGroups } from "./groups";
import { matches as staticMatches } from "./matches";
import { teamByCode, type Team } from "./teams";

export type StandingRow = {
  team: Team;
  pj: number; // partidos jugados
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

export const computeStandings = (
  groupName: string,
  matchesList = staticMatches,
  groupsList = staticGroups,
): StandingRow[] => {
  const group = groupsList.find((g) => g.name === groupName);
  const teams = group ? group.teamCodes.map(teamByCode) : [];
  const rows = new Map<string, StandingRow>(
    teams.map((t) => [t.code, { team: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 }]),
  );
  const played = matchesList.filter(
    (m) =>
      m.group === groupName &&
      m.status === "finished" &&
      m.scoreHome != null &&
      m.scoreAway != null,
  );
  for (const m of played) {
    const home = rows.get(m.home.code);
    const away = rows.get(m.away.code);
    if (!home || !away) continue; // Skip if team not in this group definition
    home.pj++;
    away.pj++;
    home.gf += m.scoreHome!;
    home.gc += m.scoreAway!;
    away.gf += m.scoreAway!;
    away.gc += m.scoreHome!;
    if (m.scoreHome! > m.scoreAway!) {
      home.g++;
      away.p++;
      home.pts += 3;
    } else if (m.scoreHome! < m.scoreAway!) {
      away.g++;
      home.p++;
      away.pts += 3;
    } else {
      home.e++;
      away.e++;
      home.pts++;
      away.pts++;
    }
  }
  for (const r of rows.values()) r.dg = r.gf - r.gc;
  return Array.from(rows.values()).sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.team.name.localeCompare(b.team.name),
  );
};

export const allStandings = (
  matchesList = staticMatches,
  groupsList = staticGroups,
): { group: string; rows: StandingRow[] }[] =>
  groupsList.map((g) => ({
    group: g.name,
    rows: computeStandings(g.name, matchesList, groupsList),
  }));
