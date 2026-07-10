import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Check, ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { allGroupTeams, teamByCode, teams } from "@/data";
import { predictionsStore, useChampion } from "@/lib/predictionsStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const sortedTeamCodes = [...teams].map((t) => t.code).sort();

interface ConfigRow {
  home_score: number;
  profiles:
    | {
        is_admin: boolean;
      }
    | {
        is_admin: boolean;
      }[]
    | null;
}

export const Route = createFileRoute("/champion")({
  head: () => ({
    meta: [
      { title: "Campeón del Mundo · Golazo" },
      { name: "description", content: "Elige al campeón del Mundial 2026. 20 puntos si aciertas." },
    ],
  }),
  component: ChampionPage,
});

function ChampionPage() {
  const { user, profile } = useAuth();
  const localChampionCode = useChampion();
  const championCode = localChampionCode || profile?.country_code || null;
  const champion = championCode ? teamByCode(championCode) : null;
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [togglingConfig, setTogglingConfig] = useState(false);

  const isAdmin = profile?.is_admin || user?.email === "alxndrgm@gmail.com";

  // Query to get the global config for champion changes
  const { data: configRows, refetch: refetchConfig } = useQuery({
    queryKey: ["configAllowChampionChange"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select(
          `
          home_score,
          profiles (
            is_admin
          )
        `,
        )
        .eq("match_id", "config_allow_champion_change");
      if (error) throw error;
      return data || [];
    },
    staleTime: 0, // Always fetch fresh
  });

  const allowChanges =
    (configRows as unknown as ConfigRow[])?.some((row) => {
      const isRowAdmin = Array.isArray(row.profiles)
        ? row.profiles[0]?.is_admin
        : row.profiles?.is_admin;
      return row.home_score === 1 && isRowAdmin;
    }) ?? false;

  const handleToggleConfig = async () => {
    if (!user) return;
    setTogglingConfig(true);
    try {
      const targetScore = allowChanges ? 0 : 1;
      const { error } = await supabase.from("predictions").upsert(
        {
          user_id: user.id,
          match_id: "config_allow_champion_change",
          home_score: targetScore,
          away_score: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,match_id" },
      );
      if (error) throw error;
      toast.success(
        targetScore === 1
          ? "¡Cambios de campeón mundial habilitados para todos los usuarios!"
          : "¡Cambios de campeón mundial bloqueados exitosamente!",
      );
      refetchConfig();
    } catch (err: unknown) {
      console.error("Error al guardar config de campeón en Supabase:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Error al actualizar la configuración: " + errMsg);
    } finally {
      setTogglingConfig(false);
    }
  };

  const filtered = allGroupTeams()
    .filter(
      (t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.short.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell>
      <header className="px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <Link
          to="/matches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </Link>
        <span className="mt-3 block text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
          Predicción Especial · 20 pts
        </span>
        <h1 className="font-display mt-1 text-5xl leading-none text-white">Campeón del Mundo</h1>
        <p className="mt-2 text-sm text-white/55">
          Elige una de las 48 selecciones que levantará la copa.
        </p>
      </header>

      {/* Admin control panel */}
      {isAdmin && (
        <section className="mt-4 px-4">
          <div className="glass rounded-3xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <h3 className="font-display text-xl text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-primary" /> Control de Predicciones
            </h3>
            <p className="text-[11px] text-white/60 mb-4">
              Como administrador, puedes bloquear o permitir cambios en el equipo campeón mundial
              para todos los usuarios.
            </p>
            <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/5">
              <div>
                <div className="text-xs font-semibold text-white uppercase tracking-wider">
                  Cambios de Campeón
                </div>
                <div className="text-sm font-semibold mt-0.5 text-primary">
                  {allowChanges ? "✅ Habilitados para todos" : "🔒 Bloqueados (Por defecto)"}
                </div>
              </div>
              <button
                disabled={togglingConfig}
                onClick={handleToggleConfig}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer ${
                  allowChanges
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/25 border border-red-500/20"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20"
                }`}
              >
                {allowChanges ? "Bloquear Cambios" : "Permitir Cambios"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Blocked message for non-admins */}
      {!isAdmin && !allowChanges && (
        <div className="mx-4 mt-4 glass-strong border border-red-500/30 rounded-2xl p-4 bg-red-500/5 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-400">
            <span className="text-lg">⚠️</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Cambios Bloqueados
            </div>
            <div className="text-sm text-white/80 font-medium font-display leading-tight">
              ya estamos en cuartos de final no se puede cambiar el equipo
            </div>
          </div>
        </div>
      )}

      {/* Trophy + current pick */}
      <section className="mt-6 px-4">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.86_0.22_152/0.18),transparent_60%)]" />
          <div className="relative">
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.9_0.18_85)] to-[oklch(0.65_0.18_60)] shadow-[0_20px_60px_-10px_oklch(0.9_0.18_85/0.5)]">
              <Trophy className="h-14 w-14 text-[oklch(0.2_0.05_70)]" strokeWidth={1.5} />
            </div>
            <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-white/40">
              Tu Predicción
            </div>
            {champion ? (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Flag code={champion.code} size={48} />
                <div className="text-left">
                  <div className="font-display text-3xl text-gradient-gold">{champion.name}</div>
                  {!isAdmin && !allowChanges ? (
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30 block mt-1">
                      Cambios bloqueados
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        predictionsStore.setChampion(null);
                        if (user) {
                          try {
                            const { error } = await supabase
                              .from("predictions")
                              .delete()
                              .eq("user_id", user.id)
                              .eq("match_id", "champion");
                            if (error) throw error;
                            toast.info("Predicción de campeón eliminada");
                          } catch (err) {
                            console.error("Error al eliminar campeón de Supabase:", err);
                          }
                        }
                      }}
                      className="text-[11px] font-semibold uppercase tracking-widest text-primary hover:underline cursor-pointer"
                    >
                      Cambiar predicción
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 font-display text-2xl text-white/40">— Sin elegir —</div>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="mt-6 px-4">
        <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar selección…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </section>

      {/* Grid */}
      <section className="mt-4 grid grid-cols-2 gap-3 px-4">
        {filtered.map((t) => {
          const selected = championCode === t.code;
          const isConfirming = confirming === t.code;
          const disabled = !isAdmin && !allowChanges;
          return (
            <button
              key={t.code}
              disabled={disabled}
              onClick={async () => {
                if (disabled) {
                  toast.error("ya estamos en cuartos de final no se puede cambiar el equipo");
                  return;
                }
                if (isConfirming) {
                  predictionsStore.setChampion(t.code);
                  setConfirming(null);
                  if (user) {
                    try {
                      const teamIndex = sortedTeamCodes.indexOf(t.code);
                      if (teamIndex !== -1) {
                        const { error } = await supabase.from("predictions").upsert(
                          {
                            user_id: user.id,
                            match_id: "champion",
                            home_score: teamIndex,
                            away_score: 0,
                            updated_at: new Date().toISOString(),
                          },
                          { onConflict: "user_id,match_id" },
                        );
                        if (error) throw error;
                        toast.success(`¡Elegiste a ${t.name} como Campeón Mundial!`);
                      }
                    } catch (err) {
                      console.error("Error al guardar campeón en Supabase:", err);
                      toast.error("Error al sincronizar tu campeón en el ranking");
                    }
                  }
                } else {
                  setConfirming(t.code);
                }
              }}
              onBlur={() => setConfirming((c) => (c === t.code ? null : c))}
              className={`glass relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition ${
                selected ? "ring-2 ring-primary neon-glow" : ""
              } ${
                disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-white/8 active:scale-95 cursor-pointer"
              }`}
            >
              {selected && (
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              <Flag code={t.code} size={56} />
              <div className="font-display text-base leading-tight text-white">{t.short}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/45">{t.name}</div>
              {isConfirming && !selected && !disabled && (
                <span className="mt-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  Confirmar
                </span>
              )}
            </button>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-white/45">Sin resultados</p>
      )}
    </AppShell>
  );
}
