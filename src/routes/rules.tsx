import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, FileText, ShieldCheck, Trophy, Sparkles, Target, Zap, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { z } from "zod";

const rulesSearchSchema = z.object({
  tab: z.enum(["manual", "terms", "privacy"]).catch("manual"),
});

export const Route = createFileRoute("/rules")({
  validateSearch: (search) => rulesSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Reglamento y Manual · Golazo" },
      { name: "description", content: "Reglas de la quiniela, manual de puntuación, términos y políticas de Golazo." },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeTab, setActiveTab] = useState<"manual" | "terms" | "privacy">(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const updateTab = (newTab: "manual" | "terms" | "privacy") => {
    setActiveTab(newTab);
    navigate({ search: { tab: newTab } });
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Perfil
        </Link>
        <span className="mt-3 block text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
          Información Oficial
        </span>
        <h1 className="font-display mt-1 text-5xl leading-none text-white">Reglamento</h1>
        <p className="mt-2 text-sm text-white/55">Conoce las reglas de la quiniela, puntuaciones y términos legales.</p>
      </header>

      {/* Tabs Selector */}
      <section className="mt-6 px-4">
        <div className="flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
          <button
            onClick={() => updateTab("manual")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "manual" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Manual
          </button>
          <button
            onClick={() => updateTab("terms")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "terms" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Términos
          </button>
          <button
            onClick={() => updateTab("privacy")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "privacy" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Privacidad
          </button>
        </div>
      </section>

      {/* Tab Content */}
      <section className="mt-6 px-4 mb-10">
        {activeTab === "manual" && <GameManualContent />}
        {activeTab === "terms" && <TermsContent />}
        {activeTab === "privacy" && <PrivacyContent />}
      </section>
    </AppShell>
  );
}

// ── MANUAL DE JUEGO ──────────────────────────────────────────────────────────
function GameManualContent() {
  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="glass p-5 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <h3 className="font-display text-2xl text-white mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> ¿Cómo Jugar Golazo?
        </h3>
        <p className="text-sm text-white/70 leading-relaxed">
          Golazo es la quiniela definitiva del Mundial 2026. Predice los marcadores de los partidos, acumula puntos basados en los resultados oficiales de la vida real y asciende en la clasificación global frente a todos los participantes de la plataforma.
        </p>
      </div>

      {/* Puntuación */}
      <div className="glass p-5 rounded-3xl space-y-4">
        <h3 className="font-display text-2xl text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Sistema de Puntuación
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
              +3
            </span>
            <div>
              <span className="font-bold text-white block text-sm">Marcador Exacto</span>
              <p className="text-xs text-white/50 mt-0.5">
                Acertaste el marcador final exacto de ambos equipos. Por ejemplo, predijiste `2 - 1` y el partido termina `2 - 1`.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-white/80 font-bold text-xs">
              +1
            </span>
            <div>
              <span className="font-bold text-white block text-sm">Resultado / Ganador Correcto</span>
              <p className="text-xs text-white/50 mt-0.5">
                Acertaste al ganador del partido o el empate, pero no los goles exactos. Por ejemplo, predijiste `1 - 0` y el partido termina `3 - 1` (ambos victorias de local).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 text-white/30 font-bold text-xs">
              0
            </span>
            <div>
              <span className="font-bold text-white block text-sm">Sin Puntos</span>
              <p className="text-xs text-white/50 mt-0.5">
                No acertaste al ganador ni al empate del partido.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-white/10 pt-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[oklch(0.9_0.18_85)] to-[oklch(0.65_0.18_60)] text-black font-extrabold text-xs">
              +20
            </span>
            <div>
              <span className="font-bold text-[oklch(0.9_0.18_85)] block text-sm">Predicción Especial: Campeón del Mundo</span>
              <p className="text-xs text-white/50 mt-0.5">
                Elige al equipo que levantará la copa del mundo. Esta elección te otorga **20 puntos** extras directos al finalizar el torneo si tu equipo se consagra campeón.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premios y Estructura */}
      <div className="glass p-5 rounded-3xl space-y-4">
        <h3 className="font-display text-2xl text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Estructura de Premios
        </h3>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute right-3 top-3 text-2xl">🏆</div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">Premio Mayor</span>
            <span className="font-display text-xl text-white block mt-0.5">Primer Lugar de la Clasificación</span>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              El pronosticador que finalice en el **puesto #1** del Ranking Global al concluir la final de la Copa del Mundo se coronará campeón de la quiniela y recibirá el **Premio Principal Grande**.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute right-3 top-3 text-2xl">🌍</div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">Premio Especial</span>
            <span className="font-display text-xl text-white block mt-0.5">Acierto del Campeón Mundial</span>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              Todos los usuarios que acierten correctamente a la selección que se corona campeona del mundo (usando la predicción especial de Campeón) ganarán un **Premio Dedicado Secundario**.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute right-3 top-3 text-2xl">🏅</div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">Premios Mensuales y Sorteos</span>
            <span className="font-display text-xl text-white block mt-0.5">Aciertos por Partido</span>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              Cada acierto (sin importar si es exacto o de ganador) te otorga puntos. Se realizarán sorteos periódicos de artículos oficiales del mundial entre todos los usuarios que acumulen puntos.
            </p>
          </div>
        </div>
      </div>

      {/* Logros Especiales y Funcionamiento */}
      <div className="glass p-5 rounded-3xl space-y-4">
        <h3 className="font-display text-2xl text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Logros Especiales
        </h3>
        <p className="text-xs text-white/60 leading-relaxed">
          Además de la tabla de posiciones general, puedes desbloquear logros especiales que otorgan premios por separado.
        </p>

        <div className="space-y-3.5">
          <div className="flex gap-3">
            <div className="text-3xl shrink-0 mt-0.5">⚽</div>
            <div>
              <span className="font-bold text-white block text-sm">Primer Gol (Premio por Participación)</span>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Otorgado al registrar y guardar tu **primer pronóstico** en la aplicación. Te acredita la medalla en tu perfil y te ingresa a la lista de participantes oficiales.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="text-3xl shrink-0 mt-0.5">🎯</div>
            <div>
              <span className="font-bold text-white block text-sm">Hat-Trick (Premio a la Racha Activa)</span>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Otorgado al acertar **3 marcadores exactos de forma consecutiva**. Demuestra tu nivel experto y te hace acreedor de un premio especial de alta precisión.
              </p>
            </div>
          </div>

          {/* ACLARACION DE ESCOGER */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">Pregunta Frecuente</span>
            <span className="font-semibold text-white block text-sm mt-0.5">¿Cómo se eligen estos logros?</span>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              **Estos logros no se seleccionan manualmente en una pantalla**. Son logros **dinámicos** y se calculan y otorgan automáticamente. El sistema audita tus predicciones en tiempo real y, en el momento que realizas tu primer pronóstico o encadenas 3 marcadores exactos seguidos, el logro se activa y se asigna a tu cuenta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TÉRMINOS Y CONDICIONES ───────────────────────────────────────────────────
function TermsContent() {
  return (
    <div className="space-y-4 text-xs text-white/70 leading-relaxed">
      <div className="glass p-5 rounded-3xl space-y-4">
        <h3 className="font-display text-2xl text-white">Términos de Servicio</h3>
        <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Última actualización: Junio 2026</p>
        
        <div className="space-y-3">
          <p>
            Al registrarte e iniciar sesión en Golazo, aceptas los presentes términos y condiciones de juego. Te recomendamos leerlos detalladamente para asegurar una competencia limpia.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">1. Elegibilidad para Participar</h4>
          <p>
            La quiniela está abierta a todos los entusiastas del fútbol. Para reclamar premios físicos o monetarios en caso de resultar ganador, el participante debe cumplir con la legislación local de su país de residencia.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">2. Reglas del Ranking y Desempate</h4>
          <p>
            La clasificación se ordena de manera descendente en base a los puntos totales de cada perfil. En caso de empate en puntos entre dos o más usuarios, el sistema aplicará los siguientes criterios de desempate en orden de prioridad:
          </p>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-white/60">
            <li>Mayor cantidad de <strong>Marcadores Exactos</strong> acertados (3 puntos).</li>
            <li>Mayor porcentaje de <strong>Precisión</strong> global de predicciones.</li>
            <li>Fecha y hora de registro de la cuenta (el usuario registrado más antiguo tiene la ventaja).</li>
          </ul>

          <h4 className="font-bold text-white text-sm mt-4">3. Tiempos Límite de Predicción</h4>
          <p>
            Por motivos de juego justo, las predicciones de cada partido se cierran de manera estricta en el segundo que se marca el inicio oficial del partido (pitazo inicial). Una vez transcurrido este tiempo límite, el selector de predicción se bloqueará y no se admitirán registros ni modificaciones bajo ninguna circunstancia.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">4. Juego Limpio y Prohibición de Abuso</h4>
          <p>
            Queda estrictamente prohibido el uso de herramientas de automatización, bots o la creación de múltiples cuentas por un mismo individuo para obtener ventajas estadísticas. Cualquier cuenta sospechosa de realizar conductas fraudulentas será dada de baja y excluida permanentemente de las tablas de clasificación de la quiniela sin derecho a reclamos.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">5. Modificación de Premios</h4>
          <p>
            Los organizadores se reservan el derecho de modificar los premios ofrecidos por equivalentes de igual o mayor valor en caso de indisponibilidad logística, informando de ello oportunamente a la comunidad de usuarios.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── POLÍTICAS DE PRIVACIDAD ───────────────────────────────────────────────────
function PrivacyContent() {
  return (
    <div className="space-y-4 text-xs text-white/70 leading-relaxed">
      <div className="glass p-5 rounded-3xl space-y-4">
        <h3 className="font-display text-2xl text-white">Política de Privacidad</h3>
        <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Última actualización: Junio 2026</p>

        <div className="space-y-3">
          <p>
            En Golazo nos tomamos muy en serio la seguridad y confidencialidad de tu información personal. Esta política explica cómo recopilamos, protegemos y utilizamos tus datos.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">1. Datos Recopilados</h4>
          <p>
            Al registrarte en Golazo, recopilamos únicamente los datos esenciales para la operación de la quiniela:
          </p>
          <ul className="list-disc pl-4 space-y-1 mt-1 text-white/60">
            <li><strong>Dirección de correo electrónico:</strong> Necesaria para el inicio de sesión único, validación de cuenta y el restablecimiento de contraseñas olvidadas.</li>
            <li><strong>Nombre de usuario y nombre completo:</strong> Utilizados exclusivamente para identificarte en el Ranking Global y podio del juego.</li>
            <li><strong>Selección Favorita:</strong> Sirve para personalizar tu avatar y tu bandera nacional en la tabla de clasificación.</li>
          </ul>

          <h4 className="font-bold text-white text-sm mt-4">2. Protección y Seguridad de la Información</h4>
          <p>
            Golazo no gestiona contraseñas en texto plano ni almacena información en servidores desprotegidos. Toda la autenticación se realiza mediante el SDK cifrado de <strong>Supabase Auth</strong>. El acceso a los datos de predicciones está controlado por directivas de seguridad a nivel de fila (RLS - Row Level Security), garantizando que solo tú puedas editar o guardar tus predicciones.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">3. Compartir Información</h4>
          <p>
            Tus datos de contacto (como tu correo electrónico) jamás serán vendidos, alquilados o compartidos con terceros con fines comerciales o de spam. Solo utilizaremos tu correo electrónico para contactarte y coordinar la entrega física de tus premios si resultas ganador de alguno de los sorteos o del ranking general.
          </p>

          <h4 className="font-bold text-white text-sm mt-4">4. Derechos del Usuario</h4>
          <p>
            Puedes actualizar tus datos de perfil en cualquier momento desde la sección de seguridad de tu cuenta. Si deseas dar de baja tu perfil y borrar tus predicciones permanentemente de nuestra base de datos, puedes solicitarlo escribiendo a nuestro canal de soporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
}
