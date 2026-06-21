import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Trophy, Menu, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { MatchCard } from "@/components/MatchCard";
import { groups as staticGroups, matchesByGroup, matchesByStage, computeStandings, matches as staticMatches } from "@/data";
import type { Match, Stage, Group } from "@/data";
import { TimeFormatToggle } from "@/contexts/TimeFormat";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { z } from "zod";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/ProfileDropdown";

const matchesSearchSchema = z.object({
  group: z.string().optional(),
  stage: z.string().optional(),
});

export const Route = createFileRoute("/matches")({
  validateSearch: (search) => matchesSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Partidos · Golazo" },
      { name: "description", content: "Todos los partidos del Mundial 2026, grupo por grupo y fase final." },
    ],
  }),
  component: MatchesPage,
});

const knockoutTabs: { key: Stage; label: string }[] = [
  { key: "round-of-32", label: "32avos" },
  { key: "round-of-16", label: "Octavos" },
  { key: "quarter-final", label: "Cuartos" },
  { key: "semi-final", label: "Semis" },
  { key: "third-place", label: "3er Lugar" },
  { key: "final", label: "Final" },
];

function MatchesPage() {
  const { open: openSidebar } = useSidebar();
  const { user, profile } = useAuth();
  const { data: apiData, isFetching } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const matchesList = apiData?.matches || staticMatches;
  const groupsList = apiData?.groups || staticGroups;

  const search = Route.useSearch();

  const [mode, setMode] = useState<"group" | "knockout">("group");
  const [activeGroup, setActiveGroup] = useState<string>("A");
  const [activeStage, setActiveStage] = useState<Stage>("round-of-32");

  // Sync state with search params on load or when search params change
  useEffect(() => {
    if (search.stage) {
      setMode("knockout");
      setActiveStage(search.stage as Stage);
    } else if (search.group) {
      setMode("group");
      setActiveGroup(search.group);
    }
  }, [search.stage, search.group]);

  // Sync activeGroup when API data loads (replaces static fallback groups)
  useEffect(() => {
    if (apiData?.groups && apiData.groups.length > 0) {
      setActiveGroup((prev) => {
        const exists = apiData.groups.some((g) => g.name === prev);
        return exists ? prev : (apiData.groups[0]?.name || prev);
      });
    }
  }, [apiData]);

  return (
    <AppShell>
      <header className="relative z-20 px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={openSidebar}
            title="Menú"
            className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition"
          >
            <Menu className="h-4 w-4 text-white" />
          </button>
          <div className="flex items-center gap-2.5">
            <TimeFormatToggle />
            <ProfileDropdown />
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              {mode === "group" ? "Fase de Grupos" : "Fase Final"}
            </span>
            <h1 className="font-display mt-1 text-5xl leading-none text-white">Partidos</h1>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-sm text-white/55">Elige una fase. Predice cada partido.</p>
              {isFetching ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  <span className="animate-pulse">●</span> Cargando...
                </span>
              ) : apiData ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-400">
                  ● En vivo
                </span>
              ) : null}
            </div>
          </div>
          <TimeFormatToggle />
        </div>
        <Link
          to="/champion"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[oklch(0.9_0.18_85/0.18)] to-[oklch(0.65_0.18_60/0.12)] px-4 py-3 ring-1 ring-[oklch(0.9_0.18_85/0.3)]"
        >
          <Trophy className="h-5 w-5 text-[oklch(0.9_0.18_85)]" />
          <div className="flex-1 text-xs">
            <div className="font-bold uppercase tracking-widest text-[oklch(0.9_0.18_85)]">Campeón del Mundo · 20 pts</div>
            <div className="text-white/60">Elige a tu favorito para levantar la copa →</div>
          </div>
        </Link>
      </header>

      {/* Mode switch */}
      <div className="mt-5 flex gap-2 px-5">
        {(["group", "knockout"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition active:scale-95 ${
              mode === m ? "bg-primary text-primary-foreground neon-glow" : "glass text-white/70"
            }`}
          >
            {m === "group" ? "Grupos" : "Eliminatorias"}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-4 px-5">
        {mode === "group" ? (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Selecciona un Grupo</div>
            <div className="grid grid-cols-6 gap-2">
              {groupsList.map((g) => {
                const active = g.name === activeGroup;
                return (
                  <button
                    key={g.name}
                    onClick={() => setActiveGroup(g.name)}
                    className={`aspect-square rounded-2xl text-xs font-bold uppercase tracking-wide transition active:scale-90 flex items-center justify-center
                      ${active 
                        ? "bg-primary text-primary-foreground font-extrabold scale-105 neon-glow ring-2 ring-primary/40" 
                        : "glass text-white/75 hover:text-white hover:bg-white/10"}`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Fase Eliminatoria</div>
            <div className="grid grid-cols-3 gap-2">
              {knockoutTabs.map((t) => {
                const active = t.key === activeStage;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveStage(t.key)}
                    className={`rounded-2xl py-2.5 px-1 text-[11px] font-bold uppercase tracking-wider transition active:scale-95 text-center truncate
                      ${active 
                        ? "bg-white text-black font-extrabold ring-2 ring-white/20" 
                        : "glass text-white/70 hover:text-white hover:bg-white/10"}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>


      {mode === "group" ? (
        <GroupView groupName={activeGroup} matchesList={matchesList} groupsList={groupsList} />
      ) : (
        <StageView stage={activeStage} label={knockoutTabs.find((t) => t.key === activeStage)!.label} matchesList={matchesList} />
      )}
    </AppShell>
  );
}

function GroupView({ groupName, matchesList, groupsList }: { groupName: string; matchesList: Match[]; groupsList: Group[] }) {
  const rows = computeStandings(groupName, matchesList, groupsList);
  const groupMatches = matchesByGroup(groupName, matchesList);
  return (
    <>
      <section className="mt-6 px-4">
        <div className="glass overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="font-display text-2xl text-white">Grupo {groupName}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/45">Tabla</span>
          </div>
          <div className="grid grid-cols-[28px_1fr_repeat(5,_28px)_36px] gap-2 px-5 py-2 text-[10px] uppercase tracking-widest text-white/40">
            <span>#</span>
            <span>Equipo</span>
            <span className="text-center">PJ</span>
            <span className="text-center">G</span>
            <span className="text-center">E</span>
            <span className="text-center">P</span>
            <span className="text-center">DG</span>
            <span className="text-right">PTS</span>
          </div>
          <ul className="divide-y divide-white/5">
            {rows.map((r, i) => (
              <li
                key={r.team.code}
                className="grid grid-cols-[28px_1fr_repeat(5,_28px)_36px] items-center gap-2 px-5 py-3 text-[11px] text-white/70"
              >
                <span className={`font-display ${i < 2 ? "text-primary" : "text-white/40"}`}>{i + 1}</span>
                <div className="flex min-w-0 items-center gap-2">
                  <Flag code={r.team.code} size={28} />
                  <span className="truncate font-semibold text-white">{r.team.name}</span>
                </div>
                <span className="text-center">{r.pj}</span>
                <span className="text-center">{r.g}</span>
                <span className="text-center">{r.e}</span>
                <span className="text-center">{r.p}</span>
                <span className="text-center">{r.dg > 0 ? `+${r.dg}` : r.dg}</span>
                <span className="text-right font-display text-base text-primary">{r.pts}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 space-y-4 px-4">
        <h2 className="px-1 font-display text-2xl text-white">Partidos del Grupo {groupName}</h2>
        {[
          ...groupMatches.filter((m) => m.status !== "finished"),
          ...groupMatches.filter((m) => m.status === "finished"),
        ].map((m) => (
          <MatchCard key={m.id} match={m} dimmed={m.status === "finished"} />
        ))}
      </section>
    </>
  );
}

function StageView({ stage, label, matchesList }: { stage: Stage; label: string; matchesList: Match[] }) {
  const list = matchesByStage(stage, matchesList);
  return (
    <section className="mt-6 space-y-4 px-4">
      <h2 className="px-1 font-display text-2xl text-white">{label}</h2>
      {[
        ...list.filter((m) => m.status !== "finished"),
        ...list.filter((m) => m.status === "finished"),
      ].map((m) => (
        <MatchCard key={m.id} match={m} dimmed={m.status === "finished"} />
      ))}
    </section>
  );
}
