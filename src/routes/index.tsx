import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Trophy, Zap, Calendar, Menu, User } from "lucide-react";
import stadiumHero from "@/assets/stadium-hero.jpg";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { MatchCard } from "@/components/MatchCard";
import { matches, nextMatch, upcomingMatches, userProfile, teamByCode } from "@/data";
import { TimeFormatToggle, formatDay, formatTime, useTimeFormat, isSameDay } from "@/contexts/TimeFormat";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { useChampion, calculateUserStats, usePrediction } from "@/lib/predictionsStore";
import { getDynamicLeaderboard, getSupabaseLeaderboard } from "@/data/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { ProfileDropdown } from "@/components/ProfileDropdown";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Golazo — Inicio" },
      { name: "description", content: "Partidos próximos del Mundial 2026, tu ranking y tu próxima predicción." },
    ],
  }),
  component: HomePage,
});

function useCountdown(targetIso: string) {
  // Inicializa con el target para evitar mismatch SSR/cliente
  const target = new Date(targetIso).getTime();
  const [now, setNow] = useState<number>(target);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s };
}

function HomePage() {
  const { data: apiData } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const { user, profile } = useAuth();
  const { open: openSidebar } = useSidebar();

  const matchesList = apiData?.matches || matches;
  const stats = calculateUserStats(matchesList, profile?.country_code);

  const { data: leaderboardList = [] } = useQuery({
    queryKey: ["supabaseLeaderboard", matchesList, user?.id],
    queryFn: () => getSupabaseLeaderboard(matchesList, user?.id),
    enabled: matchesList.length > 0,
  });

  const userRank = user 
    ? leaderboardList.find(p => p.isYou)?.rank || "--"
    : "--";

  const featured = nextMatch(matchesList);
  const { format } = useTimeFormat();
  const localChampionCode = useChampion();
  const championCode = localChampionCode || profile?.country_code || null;
  const champion = championCode ? teamByCode(championCode) : null;

  // Hoy: matches del día actual del dispositivo
  const todayMatches = matchesList.filter((m) => isSameDay(m.kickoff));
  const [today, setToday] = useState<typeof matches>([]);
  useEffect(() => {
    setToday(todayMatches);
  }, [matchesList]);

  const upcoming = upcomingMatches(undefined, matchesList)
    .filter((m) => !todayMatches.some((t) => t.id === m.id))
    .slice(0, 3);

  const { h, m, s } = useCountdown(featured.kickoff);
  const featuredPrediction = usePrediction(featured.id);

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[520px] overflow-hidden">
          <img
            src={stadiumHero}
            alt="Ambiente de estadio"
            width={1080}
            height={1920}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-background/30 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,oklch(0.86_0.22_152/0.18),transparent_60%)]" />
          <div className="relative z-20 flex items-center justify-between px-5 pt-[max(20px,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
              <button
                onClick={openSidebar}
                title="Menú"
                className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition"
              >
                <Menu className="h-4 w-4 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <img
                  src="/icons/ball.png"
                  alt="Golazo"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-display text-xl leading-none tracking-wide">GOLAZO</div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">Mundial 26</div>
                </div>
              </div>
            </div>
             <div className="flex items-center gap-3">
              <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
                <Flag code={profile?.country_code || userProfile.country.code} size={22} />
                <span className="text-xs font-semibold">#{userRank}</span>
              </div>
              <ProfileDropdown />
            </div>
          </div>

          <div className="relative z-10 mt-10 px-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary ring-1 ring-primary/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Torneo en Vivo
            </span>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-white">
              Predice el<br />
              <span className="text-gradient-neon">momento de gloria.</span>
            </h1>
            <p className="mt-3 max-w-xs text-sm text-white/70">
              Cada partido. Cada marcador. Cada emoción. Escala el ranking global.
            </p>
          </div>
        </div>
      </section>

      {/* COUNTDOWN + FEATURED MATCH */}
      <section className="-mt-40 relative z-10 px-4">
        <div className="glass-strong overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Próximo Pitazo</span>
            <span className="text-[11px] uppercase tracking-wider text-white/50">
              {featured.group ? `Grupo ${featured.group}` : featured.round}
            </span>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center gap-2">
                <Flag code={featured.home.code} size={72} />
                <span className="font-display text-lg text-white">{featured.home.short}</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="font-display text-xs tracking-[0.3em] text-white/40">COMIENZA EN</div>
                <div className="mt-2 flex items-end gap-1" suppressHydrationWarning>
                  <Tile v={String(h).padStart(2, "0")} />
                  <Sep />
                  <Tile v={String(m).padStart(2, "0")} />
                  <Sep />
                  <Tile v={String(s).padStart(2, "0")} />
                </div>
                <div className="mt-2 flex gap-4 text-[9px] uppercase tracking-widest text-white/40">
                  <span className="w-9 text-center">Hrs</span>
                  <span className="w-9 text-center">Min</span>
                  <span className="w-9 text-center">Seg</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Flag code={featured.away.code} size={72} />
                <span className="font-display text-lg text-white">{featured.away.short}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-white/55">
              <span>{featured.stadium}</span>
              {featuredPrediction ? (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white/60">
                    Tu pronóstico: <span className="font-display text-primary text-sm font-bold bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">{featuredPrediction.home} - {featuredPrediction.away}</span>
                  </span>
                  <Link
                    to="/matches"
                    search={
                      featured.stage === "group"
                        ? { group: featured.group }
                        : { stage: featured.stage }
                    }
                    className="flex items-center gap-0.5 font-bold text-primary hover:underline"
                  >
                    Modificar <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/matches"
                  search={
                    featured.stage === "group"
                      ? { group: featured.group }
                      : { stage: featured.stage }
                  }
                  className="flex items-center gap-1 font-semibold text-primary"
                >
                  Predecir ahora <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 px-4">
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Tu Posición" value={`#${userRank}`} accent="gold" />
        <StatCard icon={<Zap className="h-5 w-5" />} label="Precisión" value={`${stats.accuracy}%`} accent="neon" />
      </section>

      {/* Champion CTA */}
      <section className="mt-5 px-4">
        <Link
          to="/champion"
          className="glass-strong relative flex items-center gap-4 overflow-hidden rounded-3xl p-4 transition active:scale-[0.99]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,oklch(0.9_0.18_85/0.18),transparent_60%)]" />
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.9_0.18_85)] to-[oklch(0.65_0.18_60)]">
            <Trophy className="h-7 w-7 text-[oklch(0.2_0.05_70)]" strokeWidth={1.6} />
          </div>
          <div className="relative flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.9_0.18_85)]">Predicción Especial · 20 pts</div>
            <div className="font-display text-xl text-white">Elige al Campeón del Mundo</div>
            {champion ? (
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                Tu predicción: <Flag code={champion.code} size={16} /> <span className="font-semibold text-white">{champion.name}</span>
              </div>
            ) : (
              <div className="mt-0.5 text-xs text-white/55">48 selecciones · 1 trofeo</div>
            )}
          </div>
          <ChevronRight className="relative h-5 w-5 text-white/50" />
        </Link>
      </section>

      {/* Partidos de Hoy */}
      <section className="mt-8 px-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display flex items-center gap-2 text-3xl text-white">
              <Calendar className="h-6 w-6 text-primary" /> Partidos de Hoy
            </h2>
            <p className="text-xs text-white/50">Predice antes del pitazo inicial</p>
          </div>
          <TimeFormatToggle />
        </div>

        {today.length > 0 ? (
          <div className="space-y-4">
            {[
              ...today.filter((m) => m.status !== "finished"),
              ...today.filter((m) => m.status === "finished"),
            ].map((m) => (
              <MatchCard key={m.id} match={m} dimmed={m.status === "finished"} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Sin partidos hoy</div>
            <div className="mt-2 font-display text-xl text-white">Próximo partido</div>
            <div className="mt-3 flex items-center gap-2">
              <Flag code={featured.home.code} size={32} />
              <span className="font-display text-base text-white">{featured.home.short}</span>
              <span className="text-white/30">vs</span>
              <span className="font-display text-base text-white">{featured.away.short}</span>
              <Flag code={featured.away.code} size={32} />
            </div>
            <div className="mt-2 text-xs text-white/55">
              {formatDay(featured.kickoff)} · {formatTime(featured.kickoff, format)}
            </div>
          </div>
        )}
      </section>

      {/* Próximos */}
      <section className="mt-8 px-4">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl text-white">Próximos partidos</h2>
            <p className="text-xs text-white/50">Guarda tus predicciones antes del pitazo inicial</p>
          </div>
          <Link to="/matches" className="text-xs font-semibold text-primary">Ver todos →</Link>
        </div>

        <div className="space-y-4">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Tile({ v }: { v: string }) {
  return (
    <div className="glass grid h-12 w-9 place-items-center rounded-lg">
      <span className="font-display text-2xl text-white">{v}</span>
    </div>
  );
}
function Sep() {
  return <span className="font-display pb-1 text-2xl text-primary/70">:</span>;
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "gold" | "neon" }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ${accent === "gold" ? "bg-[oklch(0.85_0.16_85/0.18)] text-[oklch(0.9_0.18_85)]" : "bg-primary/15 text-primary"}`}>
        {icon}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      <div className={`font-display text-3xl ${accent === "gold" ? "text-gradient-gold" : "text-gradient-neon"}`}>{value}</div>
    </div>
  );
}
