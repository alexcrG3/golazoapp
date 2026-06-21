import { useEffect, useState } from "react";
import { Minus, Plus, Lock, MapPin, Clock } from "lucide-react";
import type { Match } from "@/data";
import { Flag } from "./Flag";
import { useTimeFormat, formatTime, formatDay } from "@/contexts/TimeFormat";
import { predictionsStore, calculateMatchPoints, isPredictionExact, isPredictionCorrect } from "@/lib/predictionsStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function MatchCard({ match, compact = false, dimmed = false }: { match: Match; compact?: boolean; dimmed?: boolean }) {
  const { format } = useTimeFormat();
  const existing = predictionsStore.get(match.id);
  const [home, setHome] = useState<number>(existing?.home ?? 0);
  const [away, setAway] = useState<number>(existing?.away ?? 0);
  const [saved, setSaved] = useState(!!existing);
  const locked = match.status !== "scheduled";

  useEffect(() => {
    return predictionsStore.subscribe(() => {
      const p = predictionsStore.get(match.id);
      if (p) { setHome(p.home); setAway(p.away); }
    });
  }, [match.id]);

  const bump = (setter: (n: number) => void, val: number, delta: number) => {
    const next = Math.max(0, Math.min(9, val + delta));
    setter(next);
    setSaved(false);
  };

  const save = async () => {
    predictionsStore.set(match.id, { home, away });
    setSaved(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase.from("predictions").upsert(
          {
            user_id: session.user.id,
            match_id: match.id,
            home_score: home,
            away_score: away,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,match_id" }
        );
        if (error) throw error;
        toast.success("¡Pronóstico guardado en la base de datos!");
      } else {
        toast.info(
          "Guardado en tu navegador. ¡Inicia sesión en tu Perfil para entrar al ranking global!"
        );
      }
    } catch (err: any) {
      console.error("Error al guardar pronóstico en Supabase:", err);
      toast.error("Error al sincronizar con la base de datos");
    }
  };

  const isKnockout = match.stage !== "group";
  const stageLabel = match.group ? `Grupo ${match.group}` : match.round;
  const points = isKnockout ? "5 / 3 pts" : "3 / 1 pts";
  const hasRealScore = match.status === "finished" || match.status === "live";

  return (
    <div className={`glass animate-float-up relative overflow-hidden rounded-3xl ${compact ? "p-4" : "p-5"} ${dimmed ? "opacity-50 grayscale-[40%]" : ""}`}>
      <div className="mb-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
        <span className={`rounded-full px-2.5 py-1 ${isKnockout ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-white/8"}`}>
          {stageLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> {formatDay(match.kickoff)} · {formatTime(match.kickoff, format)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide team={match.home} align="left" />
        <div className="flex flex-col items-center">
          {hasRealScore && match.scoreHome !== undefined && match.scoreAway !== undefined ? (
            <div className="flex flex-col items-center">
              <span className="font-display text-3xl font-extrabold text-gradient-neon leading-none whitespace-nowrap">
                {match.scoreHome} - {match.scoreAway}
              </span>
              <span className={`mt-1.5 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                match.status === "live"
                  ? "bg-red-500/20 text-red-400 animate-pulse ring-1 ring-red-500/30"
                  : "bg-white/10 text-white/60"
              }`}>
                {match.status === "live" ? "En Vivo" : "Final"}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-display text-3xl font-extrabold text-white/20 leading-none">
                0 - 0
              </span>
              <span className="mt-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                VS
              </span>
            </div>
          )}
        </div>
        <TeamSide team={match.away} align="right" />
      </div>

      {hasRealScore ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
          <div className="text-xs">
            <span className="text-white/50">Tu pronóstico: </span>
            {existing ? (
              <span className="font-display text-sm font-bold text-white ml-1">
                {existing.home} - {existing.away}
              </span>
            ) : (
              <span className="italic text-white/35 ml-1">Sin pronóstico</span>
            )}
          </div>
          {match.status === "finished" ? (
            <div>
              {existing ? (
                (() => {
                  const pts = calculateMatchPoints(match, existing);
                  const exact = isPredictionExact(match, existing);
                  return (
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      pts > 0
                        ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30 neon-glow"
                        : "bg-white/5 text-white/35"
                    }`}>
                      {pts > 0 ? `+${pts} PTS (${exact ? "Exacto" : "Acierto"})` : "0 PTS (Fallo)"}
                    </span>
                  );
                })()
              ) : (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  0 PTS
                </span>
              )}
            </div>
          ) : (
            <span className="rounded-full bg-primary/15 text-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-primary/30 animate-pulse">
              En juego
            </span>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <ScoreSelector value={home} onChange={(d) => bump(setHome, home, d)} disabled={locked} />
          <div className="font-display text-2xl text-white/30">:</div>
          <ScoreSelector value={away} onChange={(d) => bump(setAway, away, d)} disabled={locked} />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5 text-xs text-white/55">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{match.stadium}, {match.city}</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/35">{points}</span>
        </div>
        <button
          onClick={save}
          disabled={locked}
          className={`group relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition active:scale-95
            ${locked
              ? "bg-white/5 text-white/40"
              : saved
                ? "bg-primary text-primary-foreground neon-glow"
                : "bg-white text-black hover:bg-primary"}`}
        >
          {locked ? <><Lock className="h-3.5 w-3.5" /> Cerrado</> : saved ? "Guardado ✓" : "Predecir"}
        </button>
      </div>
    </div>
  );
}

function TeamSide({ team, align }: { team: Match["home"]; align: "left" | "right" }) {
  const isTbd = team.code === "tbd";
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <Flag code={team.code} size={56} />
      <div className="min-w-0">
        <div className={`font-display text-2xl leading-none ${isTbd ? "text-white/40" : "text-white"}`}>
          {isTbd ? "TBD" : team.short}
        </div>
        <div className="mt-1 truncate text-[11px] text-white/50">{team.name}</div>
      </div>
    </div>
  );
}

function ScoreSelector({ value, onChange, disabled }: { value: number; onChange: (delta: number) => void; disabled?: boolean }) {
  return (
    <div className={`glass flex items-center justify-between rounded-2xl p-2 ${disabled ? "opacity-50" : ""}`}>
      <button
        onClick={() => onChange(-1)}
        disabled={disabled}
        className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/10 active:scale-90 disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="font-display w-10 text-center text-4xl text-gradient-neon">{value}</span>
      <button
        onClick={() => onChange(1)}
        disabled={disabled}
        className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 text-primary transition hover:bg-primary/30 active:scale-90 disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
