import { teamByCode, type Team } from "@/data/teams";
import { groups as fallbackGroups, type Group } from "@/data/groups";
import type { Match, MatchStatus, Stage } from "@/data/matches";

// ESPN display name → local team code
const espnNameToCode: Record<string, string> = {
  mexico: "mx",
  "south africa": "za",
  "south korea": "kr",
  czechia: "cz",
  "czech republic": "cz",
  canada: "ca",
  "bosnia-herzegovina": "ba",
  "bosnia and herzegovina": "ba",
  qatar: "qa",
  switzerland: "ch",
  brazil: "br",
  morocco: "ma",
  haiti: "ht",
  scotland: "gb-sct",
  "united states": "us",
  usa: "us",
  paraguay: "py",
  australia: "au",
  türkiye: "tr",
  turkey: "tr",
  germany: "de",
  curaçao: "cw",
  curacao: "cw",
  "ivory coast": "ci",
  "côte d'ivoire": "ci",
  ecuador: "ec",
  netherlands: "nl",
  japan: "jp",
  sweden: "se",
  tunisia: "tn",
  belgium: "be",
  egypt: "eg",
  iran: "ir",
  "new zealand": "nz",
  spain: "es",
  "cape verde": "cv",
  "saudi arabia": "sa",
  uruguay: "uy",
  france: "fr",
  senegal: "sn",
  iraq: "iq",
  norway: "no",
  argentina: "ar",
  algeria: "dz",
  austria: "at",
  jordan: "jo",
  portugal: "pt",
  "congo dr": "cd",
  "dr congo": "cd",
  congo: "cd",
  uzbekistan: "uz",
  colombia: "co",
  england: "gb-eng",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",
};

export function getTeamByEspnName(name: string): Team {
  const norm = name.toLowerCase().trim();
  const code = espnNameToCode[norm] ?? "tbd";
  return teamByCode(code);
}

// ── Cache ──────────────────────────────────────────────────────────────────
const CACHE_KEY = "golazo_espn_cache";
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function loadCache(): { groups: Group[]; matches: Match[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL_MS) {
      console.log("[ESPN] Usando caché local (fresco)");
      return data;
    }
  } catch {}
  return null;
}

function saveCache(data: { groups: Group[]; matches: Match[] }) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

// ── Stage mapping ──────────────────────────────────────────────────────────
function mapStage(seasonSlug: string, note: string): Stage {
  const s = (seasonSlug + " " + note).toLowerCase();
  if (s.includes("group")) return "group";
  if (s.includes("round of 32") || s.includes("32")) return "round-of-32";
  if (s.includes("round of 16") || s.includes("16")) return "round-of-16";
  if (s.includes("quarter")) return "quarter-final";
  if (s.includes("semi")) return "semi-final";
  if (s.includes("third") || s.includes("3rd") || s.includes("bronze")) return "third-place";
  if (s.includes("final")) return "final";
  return "group";
}

// ── Main fetch ─────────────────────────────────────────────────────────────
export async function fetchRealGroupsAndMatches(): Promise<{ groups: Group[]; matches: Match[] }> {
  // Return cache if fresh
  if (typeof window !== "undefined") {
    const cached = loadCache();
    if (cached) return cached;
  }

  // ESPN API — no key required, no CORS issues, real 2026 WC data
  const ESPN_URL =
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260720";

  const res = await fetch(ESPN_URL);
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const json = await res.json();

  const events: any[] = json.events || [];
  if (events.length === 0) throw new Error("ESPN: sin eventos");

  const matchesList: Match[] = [];
  const groupMap = new Map<string, Set<string>>();

  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;

    const note: string = comp.altGameNote || ""; // "FIFA World Cup, Group A"
    const seasonSlug: string = ev.season?.slug || ""; // "group-stage", "round-of-32" ...

    // Extract group letter
    const groupMatch = note.match(/Group ([A-Z])/);
    const groupLetter = groupMatch ? groupMatch[1] : undefined;

    const stage = mapStage(seasonSlug, note);

    // Teams
    const competitors: any[] = comp.competitors || [];
    const homeComp = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
    const awayComp = competitors.find((c: any) => c.homeAway === "away") || competitors[1];

    const homeTeam = getTeamByEspnName(homeComp?.team?.displayName || "");
    const awayTeam = getTeamByEspnName(awayComp?.team?.displayName || "");

    // Status
    const statusName: string = comp.status?.type?.name || "";
    const completed: boolean = comp.status?.type?.completed || false;
    let status: MatchStatus = "scheduled";
    if (completed || statusName === "STATUS_FULL_TIME" || statusName === "STATUS_FINAL") {
      status = "finished";
    } else if (
      statusName === "STATUS_IN_PROGRESS" ||
      statusName === "STATUS_HALFTIME" ||
      statusName === "STATUS_FIRST_HALF" ||
      statusName === "STATUS_SECOND_HALF"
    ) {
      status = "live";
    }

    // Scores
    const scoreHome = completed || status === "live" ? Number(homeComp?.score ?? 0) : undefined;
    const scoreAway = completed || status === "live" ? Number(awayComp?.score ?? 0) : undefined;

    // Venue
    const venue = comp.venue;
    const stadium = venue?.fullName || "Stadium";
    const city = venue?.address?.city || "City";

    // Build groups map
    if (stage === "group" && groupLetter) {
      if (!groupMap.has(groupLetter)) groupMap.set(groupLetter, new Set());
      if (homeTeam.code !== "tbd") groupMap.get(groupLetter)!.add(homeTeam.code);
      if (awayTeam.code !== "tbd") groupMap.get(groupLetter)!.add(awayTeam.code);
    }

    matchesList.push({
      id: String(ev.id),
      stage,
      group: groupLetter,
      round:
        stage === "group"
          ? `Jornada ${groupLetter || "?"}`
          : note.replace("FIFA World Cup, ", "") || stage,
      home: homeTeam,
      away: awayTeam,
      stadium,
      city,
      kickoff: ev.date,
      status,
      scoreHome,
      scoreAway,
    });
  }

  // Build Group[] from map (sorted A→L)
  const parsedGroups: Group[] = Array.from(groupMap.entries())
    .map(([name, codes]) => ({ name, teamCodes: Array.from(codes) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const result = {
    groups: parsedGroups.length > 0 ? parsedGroups : fallbackGroups,
    matches: matchesList,
  };

  // Debug
  console.log(
    "[ESPN] Grupos:",
    result.groups.map((g) => `${g.name}(${g.teamCodes.join(",")})`).join(" | "),
  );
  const finished = matchesList.filter((m) => m.status === "finished");
  console.log(`[ESPN] Total: ${matchesList.length} partidos | Terminados: ${finished.length}`);

  if (typeof window !== "undefined") saveCache(result);
  return result;
}
