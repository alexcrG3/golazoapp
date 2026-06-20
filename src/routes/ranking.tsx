import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Flame, Trophy, Menu, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { leaderboard, totalPredictors, type LeaderboardEntry } from "@/data";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { getDynamicLeaderboard, getSupabaseLeaderboard } from "@/data/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking · Golazo" },
      { name: "description", content: "Clasificación global de predicciones del Mundial." },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  const { user, profile } = useAuth();
  const { open: openSidebar } = useSidebar();

  const { data: apiData } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const matchesList = apiData?.matches || [];

  // Query para obtener el ranking dinámico desde Supabase
  const { data: dynamicLeaderboard = [] } = useQuery({
    queryKey: ["supabaseLeaderboard", matchesList, user?.id],
    queryFn: () => getSupabaseLeaderboard(matchesList, user?.id),
    enabled: matchesList.length > 0,
  });

  const [first, second, third, ...rest] = dynamicLeaderboard;

  return (
    <AppShell>
      <header className="px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={openSidebar}
            title="Menú"
            className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition"
          >
            <Menu className="h-4 w-4 text-white" />
          </button>
          <Link to="/profile" className="shrink-0 transition active:scale-95">
            {user ? (
              <Flag code={profile?.country_code || "cr"} size={32} className="ring-2 ring-white/10" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-white/5 border border-white/10 text-white/60">
                <User className="h-4 w-4" />
              </div>
            )}
          </Link>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Ranking Global</span>
        <h1 className="font-display mt-1 text-5xl leading-none text-white">Clasificación</h1>
        <p className="mt-2 text-sm text-white/55">
          {dynamicLeaderboard.length > 0 
            ? `${dynamicLeaderboard.length} pronosticadores compitiendo en la quiniela` 
            : "Compite con tus amigos en la quiniela"}
        </p>
      </header>

      {dynamicLeaderboard.length === 0 ? (
        <div className="mt-12 px-6 text-center py-16 glass rounded-3xl mx-5 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <Trophy className="h-12 w-12 text-primary mx-auto opacity-40 animate-pulse mb-4" />
          <p className="font-display text-2xl text-white">Sin Competidores</p>
          <p className="text-xs text-white/50 mt-2 max-w-[240px] mx-auto">
            No hay jugadores registrados en la base de datos todavía.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mt-4">
            ¡Sé el primero registrándote en Perfil!
          </p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <section className="mt-8 px-4">
            <div className="grid grid-cols-3 items-end gap-3">
              <PodiumCard player={second} place={2} height="h-36" />
              <PodiumCard player={first} place={1} height="h-44" featured />
              <PodiumCard player={third} place={3} height="h-32" />
            </div>
          </section>

          {/* Rest of list */}
          {rest.length > 0 && (
            <section className="mt-8 px-4 mb-6">
              <div className="glass overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/55">
                  <span>Pronosticador</span>
                  <span>Puntos</span>
                </div>
                <ul className="divide-y divide-white/5">
                  {rest.map((p) => (
                    <li
                      key={p.rank}
                      className={`flex items-center justify-between px-5 py-3.5 transition ${
                        p.isYou ? "bg-primary/10 ring-1 ring-primary/30" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`font-display w-6 text-lg ${p.isYou ? "text-primary" : "text-white/40"}`}>
                          {p.rank}
                        </span>
                        <Flag code={p.country} size={36} />
                        <div className="min-w-0">
                          <div className={`truncate font-semibold ${p.isYou ? "text-primary" : "text-white"}`}>
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-white/50">
                            <span>{p.accuracy}% prec.</span>
                            {p.streak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[oklch(0.85_0.16_50)]">
                                <Flame className="h-3 w-3" /> {p.streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="font-display text-2xl text-white">{p.points}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}

function PodiumCard({
  player,
  place,
  height,
  featured,
}: {
  player?: LeaderboardEntry;
  place: 1 | 2 | 3;
  height: string;
  featured?: boolean;
}) {
  const colors = {
    1: "text-gradient-gold",
    2: "text-white/85",
    3: "text-[oklch(0.7_0.12_45)]",
  } as const;

  const isVacant = !player;
  const displayName = player?.name || "Vacante";
  const displayPoints = player?.points !== undefined ? player.points : "-";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {featured && (
          <Crown className="absolute -top-7 left-1/2 h-6 w-6 -translate-x-1/2 text-[oklch(0.9_0.18_85)] drop-shadow-[0_0_12px_oklch(0.9_0.18_85/0.6)]" />
        )}
        {isVacant ? (
          <div
            className={`rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-xs font-bold ${
              featured ? "h-[72px] w-[72px]" : "h-[56px] w-[56px]"
            }`}
          >
            -
          </div>
        ) : (
          <Flag
            code={player.country}
            size={featured ? 72 : 56}
            className={featured ? "ring-[oklch(0.9_0.18_85/0.7)]" : ""}
          />
        )}
      </div>
      <div className="text-center w-full px-1">
        <div className="truncate text-[11px] font-semibold text-white/70">{displayName}</div>
        <div className="font-display text-base leading-none text-primary mt-0.5">{displayPoints}</div>
      </div>
      <div
        className={`glass relative flex w-full ${height} flex-col items-center justify-end rounded-2xl pb-3
          ${featured ? "neon-glow" : ""}`}
      >
        <div className="absolute inset-x-0 top-0 pitch-lines rounded-t-2xl" style={{ height: "100%" }} />
        <span className={`font-display relative text-6xl leading-none ${colors[place]}`}>{place}</span>
      </div>
    </div>
  );
}
