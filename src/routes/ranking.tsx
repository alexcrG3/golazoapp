import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Flame, Trophy, Menu, User, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { leaderboard, totalPredictors, type LeaderboardEntry, teamByCode } from "@/data";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { getDynamicLeaderboard, getSupabaseLeaderboard, getOtherPrizesStatus } from "@/data/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { useChampion } from "@/lib/predictionsStore";
import { ProfileDropdown } from "@/components/ProfileDropdown";

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
  const [activeTab, setActiveTab] = useState<"leaderboard" | "prizes">("leaderboard");
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  const { data: apiData } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000,
  });

  const matchesList = apiData?.matches || [];

  // Query para obtener el ranking dinámico desde Supabase
  const { data: dynamicLeaderboard = [] } = useQuery({
    queryKey: ["supabaseLeaderboard", matchesList, user?.id],
    queryFn: () => getSupabaseLeaderboard(matchesList, user?.id),
    enabled: matchesList.length > 0,
  });

  // Query para obtener el estado de otros premios
  const { data: prizesStatus } = useQuery({
    queryKey: ["supabaseOtherPrizes", matchesList],
    queryFn: () => getOtherPrizesStatus(matchesList),
    enabled: matchesList.length > 0,
  });

  const [first, second, third, ...rest] = dynamicLeaderboard;

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
          <ProfileDropdown />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Ranking Global</span>
        <h1 className="font-display mt-1 text-5xl leading-none text-white">Clasificación</h1>
        <p className="mt-2 text-sm text-white/55">
          {dynamicLeaderboard.length > 0 
            ? `${dynamicLeaderboard.length} pronosticadores compitiendo en la quiniela` 
            : "Compite con tus amigos en la quiniela"}
        </p>
      </header>

      {/* Tabs Selector */}
      {dynamicLeaderboard.length > 0 && (
        <section className="mt-6 px-5">
          <div className="flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "leaderboard" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" /> Posiciones
            </button>
            <button
              onClick={() => setActiveTab("prizes")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "prizes" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
              }`}
            >
              <Crown className="h-3.5 w-3.5" /> Otros Premios
            </button>
          </div>
        </section>
      )}

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
      ) : activeTab === "leaderboard" ? (
        <>
          {/* Podium */}
          <section className="mt-8 px-4">
            <div className="grid grid-cols-3 items-end gap-3">
              <PodiumCard player={second} place={2} height="h-36" onClick={() => second && setSelectedUser(second)} />
              <PodiumCard player={first} place={1} height="h-44" featured onClick={() => first && setSelectedUser(first)} />
              <PodiumCard player={third} place={3} height="h-32" onClick={() => third && setSelectedUser(third)} />
            </div>
          </section>

          {/* List of all players (including top 3) */}
          {dynamicLeaderboard.length > 0 && (
            <section className="mt-8 px-4 mb-6">
              <div className="glass overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/55">
                  <span>Pronosticador</span>
                  <span>Puntos</span>
                </div>
                <ul className="divide-y divide-white/5">
                  {dynamicLeaderboard.map((p) => (
                    <li
                      key={p.rank}
                      onClick={() => setSelectedUser(p)}
                      className={`flex items-center justify-between px-5 py-3.5 transition cursor-pointer hover:bg-white/5 active:scale-[0.99] ${
                        p.isYou ? "bg-primary/10 ring-1 ring-primary/30 hover:bg-primary/15" : ""
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
                          <div className="flex items-center gap-2 text-[11px] text-white/55">
                            <span>{p.accuracy}% prec.</span>
                            {p.streak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[oklch(0.85_0.16_50)] font-semibold">
                                <Flame className="h-3 w-3 fill-current" /> {p.streak}
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
      ) : (
        <OtherPrizesContent 
          leaderboardData={dynamicLeaderboard} 
          firstGoalWinner={prizesStatus?.firstGoalWinner || null}
          hatTrickWinners={prizesStatus?.hatTrickWinners || []}
        />
      )}

      {/* Modal de Detalles del Usuario */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-strong w-full max-w-sm rounded-3xl overflow-hidden relative border border-white/10 p-6 animate-in fade-in zoom-in duration-200">
            {/* Header / Info Personal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Flag code={selectedUser.country} size={48} className="ring-2 ring-white/10 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-xl text-gradient-gold leading-tight truncate">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                    <span>Posición #{selectedUser.rank}</span>
                    <span>•</span>
                    <span>{selectedUser.accuracy}% Precisión</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white/40 hover:text-white text-lg font-bold p-1 hover:bg-white/5 rounded-full w-8 h-8 flex items-center justify-center transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Puntuación */}
            <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Puntaje Total</span>
              <span className="font-display text-4xl text-primary mt-1 block">
                {selectedUser.points} pts
              </span>
            </div>

            {/* Desglose de Puntos */}
            <div className="mt-5 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Desglose de Puntos</span>
              
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Marcadores Exactos (+3 / +5 pts)
                </span>
                <span className="font-bold text-white">{selectedUser.exactCount || 0} partidos</span>
              </div>
              
              <div className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white/40" /> Ganadores Correctos (+1 / +3 pts)
                </span>
                <span className="font-bold text-white">{selectedUser.correctCount || 0} partidos</span>
              </div>

              <div className="flex justify-between items-center text-xs py-1.5">
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[oklch(0.9_0.18_85)]" /> Predicción Campeón (+20 pts)
                </span>
                <span className="font-bold text-[oklch(0.9_0.18_85)] flex items-center gap-1">
                  {selectedUser.championPick ? (
                    <>
                      <Flag code={selectedUser.championPick} size={16} />
                      {teamByCode(selectedUser.championPick)?.name || selectedUser.championPick.toUpperCase()}
                    </>
                  ) : (
                    "Sin Elegir"
                  )}
                </span>
              </div>
            </div>

            {/* Premios y Logros */}
            <div className="mt-5 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Premios y Logros Ganados</span>
              
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xl">🏅</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Logro "Primer Gol" (Participación)</span>
                  <span className="text-[10px] text-primary font-semibold">Calificado para todos los sorteos</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xl">🎯</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Logro "Hat-Trick" (Racha Activa)</span>
                  {selectedUser.maxStreak && selectedUser.maxStreak >= 3 ? (
                    <span className="text-[10px] text-[oklch(0.9_0.18_85)] font-bold">🏆 ¡Desbloqueado! Racha récord de {selectedUser.maxStreak}</span>
                  ) : (
                    <span className="text-[10px] text-white/45">No desbloqueado (Racha máx: {selectedUser.maxStreak || 0}/3)</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-6 w-full rounded-2xl bg-white/10 hover:bg-white/15 py-3 text-xs font-bold uppercase tracking-widest text-white transition active:scale-95"
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function PodiumCard({
  player,
  place,
  height,
  featured,
  onClick,
}: {
  player?: LeaderboardEntry;
  place: 1 | 2 | 3;
  height: string;
  featured?: boolean;
  onClick?: () => void;
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
    <div 
      onClick={!isVacant ? onClick : undefined}
      className={`flex flex-col items-center gap-2 ${!isVacant ? "cursor-pointer active:scale-[0.98] transition" : ""}`}
    >
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

function OtherPrizesContent({
  leaderboardData,
  firstGoalWinner,
  hatTrickWinners,
}: {
  leaderboardData: LeaderboardEntry[];
  firstGoalWinner: { name: string; country: string } | null;
  hatTrickWinners: { name: string; country: string; maxStreak: number }[];
}) {
  const { profile } = useAuth();
  const localChampionCode = useChampion();
  const championCode = localChampionCode || profile?.country_code || null;
  const champion = championCode ? teamByCode(championCode) : null;

  // Rachas activas de marcadores exactos (streak > 0)
  const streakPlayers = [...leaderboardData]
    .filter((p) => p.streak > 0)
    .sort((a, b) => b.streak - a.streak);

  // Calcular los favoritos de la comunidad dinámicamente según los usuarios registrados
  const totalProfiles = leaderboardData.length;
  const countryCounts: Record<string, number> = {};

  leaderboardData.forEach((p) => {
    if (p.country) {
      countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    }
  });

  const computedChoices = Object.entries(countryCounts)
    .map(([code, count]) => {
      const team = teamByCode(code);
      return {
        code,
        name: team ? team.name : code.toUpperCase(),
        percentage: totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  const defaultPopular = [
    { code: "br", name: "Brasil" },
    { code: "ar", name: "Argentina" },
    { code: "fr", name: "Francia" },
    { code: "de", name: "Alemania" },
  ];

  const popularChoices = [...computedChoices];
  for (const def of defaultPopular) {
    if (popularChoices.length >= 4) break;
    if (!popularChoices.some((c) => c.code === def.code)) {
      popularChoices.push({
        code: def.code,
        name: def.name,
        percentage: 0,
        count: 0,
      });
    }
  }

  return (
    <div className="mt-6 px-4 space-y-6 mb-10">
      {/* 🏆 CAMPEÓN MUNDIAL */}
      <div className="glass p-5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl text-white">Premio Especial: Campeón</h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Se otorga a todos los participantes que acierten correctamente qué selección nacional levantará la copa del mundo. ¡Suma 20 puntos adicionales!
        </p>

        {/* Elección del usuario */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Tu Predicción</span>
            {champion ? (
              <div className="flex items-center gap-2 mt-1">
                <Flag code={champion.code} size={20} />
                <span className="font-bold text-white text-sm">{champion.name}</span>
              </div>
            ) : (
              <span className="font-semibold text-white/55 text-sm mt-1 block">Sin elegir todavía</span>
            )}
          </div>
          <Link to="/champion" className="text-xs font-semibold uppercase tracking-widest text-primary hover:underline">
            {champion ? "Cambiar" : "Elegir"}
          </Link>
        </div>

        {/* Favoritos de la comunidad */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Favoritos de la Comunidad</span>
          <div className="grid grid-cols-2 gap-2.5">
            {popularChoices.map((c) => (
              <div key={c.code} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <Flag code={c.code} size={20} />
                  <span className="text-xs font-semibold text-white">{c.name}</span>
                </div>
                <span className="text-xs font-bold text-primary">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎯 LOGROS POR RACHA: HAT-TRICK */}
      <div className="glass p-5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[oklch(0.85_0.16_50)] animate-pulse" />
          <h3 className="font-display text-xl text-white">Logro: Hat-Trick</h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Premio especial de alta precisión otorgado de forma dinámica a quienes logren encadenar **3 o más marcadores exactos consecutivos**.
        </p>

        {/* Ganadores de Hat-Trick */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
            Ganadores del Logro (Racha 3+)
          </span>
          {hatTrickWinners.length === 0 ? (
            <p className="text-xs text-white/45 italic bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
              Ningún jugador ha desbloqueado este logro aún (se requiere racha de 3 aciertos exactos).
            </p>
          ) : (
            <div className="divide-y divide-white/5 bg-primary/5 rounded-2xl overflow-hidden border border-primary/20">
              {hatTrickWinners.map((w) => (
                <div key={w.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Flag code={w.country} size={24} />
                    <span className="text-xs font-bold text-white truncate">{w.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    🏆 Racha Máx: {w.maxStreak}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Candidatos / Rachas Activas */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
            Rachas Activas Actualmente
          </span>
          {streakPlayers.length === 0 ? (
            <p className="text-xs text-white/40 italic">Ningún jugador tiene una racha activa de marcadores exactos actualmente.</p>
          ) : (
            <div className="divide-y divide-white/5 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
              {streakPlayers.slice(0, 5).map((p) => (
                <div key={p.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Flag code={p.country} size={24} />
                    <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[oklch(0.85_0.16_50)]">
                    <Flame className="h-3.5 w-3.5 fill-current" />
                    <span>{p.streak} aciertos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🎁 SORTEOS PERIÓDICOS: PRIMER GOL */}
      <div className="glass p-5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xl text-white">Sorteos de Participación</h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Todos los participantes que registren al menos una predicción desbloquean el logro **"Primer Gol"** y entran a sorteos periódicos de artículos oficiales del mundial.
        </p>

        {/* Ganador del primer gol */}
        {firstGoalWinner ? (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
            <Trophy className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                Ganador del Primer Gol (Primer Pronóstico del Torneo)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Flag code={firstGoalWinner.country} size={18} />
                <span className="text-xs font-bold text-white truncate">{firstGoalWinner.name}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-white/45 italic">
            Nadie ha registrado un pronóstico en la app todavía.
          </div>
        )}

        {/* Próximos Premios a Sortear */}
        <div className="space-y-2.5 pt-3 border-t border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
            Próximos Premios a Sortear
          </span>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-2xl shrink-0">⚽</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Balón Oficial del Mundial 2026</span>
                <span className="text-[10px] text-primary font-semibold">Sorteo: Fin de Fase de Grupos</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-2xl shrink-0">👕</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Camiseta Oficial de tu Selección Favorita</span>
                <span className="text-[10px] text-primary font-semibold">Sorteo: Fin de Octavos de Final</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-2xl shrink-0">🎟️</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Kit Oficial de Fanático (Gorra + Mochila + Taza)</span>
                <span className="text-[10px] text-primary font-semibold">Sorteo: Fin de Cuartos de Final</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Estado del Sorteo</span>
          <span className="font-display text-2xl text-white mt-1 block">
            {leaderboardData.length} Calificados
          </span>
          <p className="text-[11px] text-white/60 mt-1">
            ¡Todos los pronosticadores de la tabla ya están participando!
          </p>
        </div>
      </div>
    </div>
  );
}
