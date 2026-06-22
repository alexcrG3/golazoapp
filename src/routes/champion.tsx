import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Check, ArrowLeft, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { allGroupTeams, teamByCode } from "@/data";
import { predictionsStore, useChampion } from "@/lib/predictionsStore";
import { useAuth } from "@/hooks/useAuth";

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
  const { profile } = useAuth();
  const localChampionCode = useChampion();
  const championCode = localChampionCode || profile?.country_code || null;
  const champion = championCode ? teamByCode(championCode) : null;
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  const filtered = allGroupTeams()
    .filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.short.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell>
      <header className="px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </Link>
        <span className="mt-3 block text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
          Predicción Especial · 20 pts
        </span>
        <h1 className="font-display mt-1 text-5xl leading-none text-white">Campeón del Mundo</h1>
        <p className="mt-2 text-sm text-white/55">Elige una de las 48 selecciones que levantará la copa.</p>
      </header>

      {/* Trophy + current pick */}
      <section className="mt-6 px-4">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.86_0.22_152/0.18),transparent_60%)]" />
          <div className="relative">
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.9_0.18_85)] to-[oklch(0.65_0.18_60)] shadow-[0_20px_60px_-10px_oklch(0.9_0.18_85/0.5)]">
              <Trophy className="h-14 w-14 text-[oklch(0.2_0.05_70)]" strokeWidth={1.5} />
            </div>
            <div className="mt-5 text-[10px] uppercase tracking-[0.3em] text-white/40">Tu Predicción</div>
            {champion ? (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Flag code={champion.code} size={48} />
                <div className="text-left">
                  <div className="font-display text-3xl text-gradient-gold">{champion.name}</div>
                  <button
                    onClick={() => predictionsStore.setChampion(null)}
                    className="text-[11px] font-semibold uppercase tracking-widest text-primary"
                  >
                    Cambiar predicción
                  </button>
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
          return (
            <button
              key={t.code}
              onClick={() => {
                if (isConfirming) {
                  predictionsStore.setChampion(t.code);
                  setConfirming(null);
                } else {
                  setConfirming(t.code);
                }
              }}
              onBlur={() => setConfirming((c) => (c === t.code ? null : c))}
              className={`glass relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition active:scale-95 ${
                selected ? "ring-2 ring-primary neon-glow" : "hover:bg-white/8"
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
              {isConfirming && !selected && (
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
