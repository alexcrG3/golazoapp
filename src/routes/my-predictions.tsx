import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Trophy, CheckCircle, XCircle, Clock, Calendar, ChevronRight, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { matches as staticMatches } from "@/data/matches";
import { 
  predictionsStore, 
  calculateMatchPoints, 
  isPredictionExact, 
  isPredictionCorrect 
} from "@/lib/predictionsStore";
import { useTimeFormat, formatTime, formatDay } from "@/contexts/TimeFormat";

export const Route = createFileRoute("/my-predictions")({
  head: () => ({
    meta: [
      { title: "Mis Pronósticos · Golazo" },
      { name: "description", content: "Historial completo de tus predicciones y comparación con los resultados reales." },
    ],
  }),
  component: MyPredictionsPage,
});

type FilterType = "all" | "finished" | "pending";

function MyPredictionsPage() {
  const { format } = useTimeFormat();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: apiData } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const matchesList = apiData?.matches || staticMatches;
  const userPredictions = predictionsStore.getAll();

  // Filtrar los partidos que tienen una predicción del usuario
  const predictedMatches = matchesList.filter((m) => userPredictions[m.id]);

  // Aplicar el filtro de pestaña
  const filteredMatches = predictedMatches.filter((m) => {
    if (filter === "finished") {
      return m.status === "finished";
    }
    if (filter === "pending") {
      return m.status === "scheduled" || m.status === "live";
    }
    return true;
  });

  // Ordenar: cronológico ascendente (más antiguos primero)
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });

  return (
    <AppShell>
      <header className="px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition active:scale-90"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Historial</span>
            <h1 className="font-display mt-0.5 text-4xl leading-none text-white">Mis Pronósticos</h1>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/55">
          Compara lo que predijiste con los resultados oficiales de la FIFA en tiempo real.
        </p>
      </header>

      {/* Selector de Filtros */}
      <div className="mt-6 flex gap-2 px-5">
        {(["all", "finished", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-2xl py-2 px-3 text-[11px] font-bold uppercase tracking-widest transition active:scale-95 text-center truncate ${
              filter === f ? "bg-primary text-primary-foreground neon-glow" : "glass text-white/70"
            }`}
          >
            {f === "all" ? "Todos" : f === "finished" ? "Finalizados" : "Pendientes"}
          </button>
        ))}
      </div>

      <section className="mt-6 px-4 mb-20 space-y-4">
        {sortedMatches.length > 0 ? (
          sortedMatches.map((match) => {
            const pred = userPredictions[match.id];
            const hasScore = match.status === "finished" || match.status === "live";
            const pts = calculateMatchPoints(match, pred);
            const exact = isPredictionExact(match, pred);
            const correct = isPredictionCorrect(match, pred);

            return (
              <div
                key={match.id}
                className="glass relative overflow-hidden rounded-3xl p-4.5 flex flex-col gap-3"
              >
                {/* Cabecera de la tarjeta del partido */}
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/45">
                  <span className="rounded-full bg-white/5 px-2 py-0.5">
                    {match.group ? `Grupo ${match.group}` : match.round}
                  </span>
                  <span>
                    {formatDay(match.kickoff)} · {formatTime(match.kickoff, format)}
                  </span>
                </div>

                {/* Grid comparador */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
                  {/* Local */}
                  <div className="flex items-center gap-2">
                    <Flag code={match.home.code} size={32} />
                    <span className="font-display text-sm text-white truncate">{match.home.short}</span>
                  </div>

                  {/* Resultados y Comparador */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      {/* Tu Pronóstico */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Tu Pred</span>
                        <span className="font-display text-xl font-extrabold text-white mt-0.5">
                          {pred.home} - {pred.away}
                        </span>
                      </div>

                      <div className="h-6 w-[1px] bg-white/10 self-end mb-1" />

                      {/* Resultado Real */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Real</span>
                        <span className={`font-display text-xl font-extrabold mt-0.5 ${hasScore ? "text-gradient-neon" : "text-white/20"}`}>
                          {hasScore ? `${match.scoreHome} - ${match.scoreAway}` : "- - -"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-2 flex-row-reverse text-right">
                    <Flag code={match.away.code} size={32} />
                    <span className="font-display text-sm text-white truncate">{match.away.short}</span>
                  </div>
                </div>

                {/* Estatus y Puntos ganados */}
                <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                  <div>
                    {match.status === "finished" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">
                        Finalizado
                      </span>
                    ) : match.status === "live" ? (
                      <a
                        href={`https://www.google.com/search?q=ver+${encodeURIComponent(match.home.name + " vs " + match.away.name)}+en+vivo+online+gratis`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400 animate-pulse ring-1 ring-red-500/30 hover:bg-red-500/25 transition active:scale-95 cursor-pointer"
                        title="Haz clic para buscar transmisiones gratuitas en vivo"
                      >
                        En Juego 📺
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/35">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <div>
                    {match.status === "finished" ? (
                      pts > 0 ? (
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                          exact
                            ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30 neon-glow"
                            : "bg-primary/15 text-primary ring-1 ring-primary/30"
                        }`}>
                          +{pts} PTS ({exact ? "Exacto" : "Acierto"})
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/35">
                          0 PTS (Fallo)
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-white/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Esperando
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass rounded-3xl p-8 text-center py-16">
            <Trophy className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-display text-lg text-white">Sin pronósticos</h3>
            <p className="text-xs text-white/50 mt-1 max-w-[220px] mx-auto">
              {filter === "all"
                ? "No has guardado ninguna predicción para los partidos todavía."
                : filter === "finished"
                ? "No tienes predicciones en partidos que hayan finalizado."
                : "No tienes predicciones pendientes por jugar."}
            </p>
            {filter === "all" && (
              <Link
                to="/matches"
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground neon-glow"
              >
                Hacer Predicciones <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}
