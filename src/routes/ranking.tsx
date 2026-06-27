import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Flame, Trophy, Menu, User, Sparkles, Users, Plus, Clipboard, ArrowLeft, LogOut, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { leaderboard, totalPredictors, type LeaderboardEntry, teamByCode } from "@/data";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { getDynamicLeaderboard, getSupabaseLeaderboard, getOtherPrizesStatus } from "@/data/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { useChampion, calculateMatchPoints, isPredictionExact, isPredictionCorrect } from "@/lib/predictionsStore";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { groupsService } from "@/lib/groups";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<"leaderboard" | "groups" | "prizes">("groups");
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  // Determinar si el usuario es del grupo original
  const ORIGINAL_USERNAMES = ["alexg3", "ghiuly", "eilyn", "gianna", "javiertroz"];
  const isOriginalUser = !!profile && ORIGINAL_USERNAMES.includes(profile.username);

  // Forzar tab de grupos por defecto para usuarios nuevos
  useEffect(() => {
    if (user && !isOriginalUser && activeTab === "leaderboard") {
      setActiveTab("groups");
    }
  }, [user, isOriginalUser, activeTab]);

  // Estados para grupos privados
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinGroupCode, setJoinGroupCode] = useState("");
  const [isSubmittingGroupAction, setIsSubmittingGroupAction] = useState(false);

  const { data: apiData, isLoading: matchesLoading } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000,
  });

  const matchesList = apiData?.matches || [];

  // Query para obtener el ranking dinámico desde Supabase
  const { data: dynamicLeaderboard = [], isLoading: leaderboardLoading } = useQuery({
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

  // Query para obtener los grupos a los que pertenece el usuario
  const { data: userGroups = [], refetch: refetchGroups, isLoading: userGroupsLoading } = useQuery({
    queryKey: ["userGroups", user?.id],
    queryFn: () => groupsService.getUserGroups(user!.id),
    enabled: !!user?.id,
  });

  // Query para obtener el leaderboard del grupo seleccionado
  const { data: groupLeaderboard = [], isLoading: groupLeaderboardLoading } = useQuery({
    queryKey: ["groupLeaderboard", activeGroupId, matchesList],
    queryFn: () => groupsService.getGroupLeaderboard(activeGroupId!, matchesList),
    enabled: !!activeGroupId && matchesList.length > 0,
  });

  // Buscar el grupo actualmente seleccionado en la lista de grupos
  const activeGroup = userGroups.find((g) => g.id === activeGroupId);

  // Mapear top 3 del grupo para el podio
  const gFirst = groupLeaderboard[0] ? {
    rank: 1,
    name: groupLeaderboard[0].name,
    country: groupLeaderboard[0].country,
    points: groupLeaderboard[0].points,
    accuracy: groupLeaderboard[0].accuracy,
    streak: 0,
    isYou: groupLeaderboard[0].id === user?.id,
    id: groupLeaderboard[0].id,
    exactCount: groupLeaderboard[0].exactCount,
    correctCount: groupLeaderboard[0].correctCount,
    championPick: null,
  } : undefined;

  const gSecond = groupLeaderboard[1] ? {
    rank: 2,
    name: groupLeaderboard[1].name,
    country: groupLeaderboard[1].country,
    points: groupLeaderboard[1].points,
    accuracy: groupLeaderboard[1].accuracy,
    streak: 0,
    isYou: groupLeaderboard[1].id === user?.id,
    id: groupLeaderboard[1].id,
    exactCount: groupLeaderboard[1].exactCount,
    correctCount: groupLeaderboard[1].correctCount,
    championPick: null,
  } : undefined;

  const gThird = groupLeaderboard[2] ? {
    rank: 3,
    name: groupLeaderboard[2].name,
    country: groupLeaderboard[2].country,
    points: groupLeaderboard[2].points,
    accuracy: groupLeaderboard[2].accuracy,
    streak: 0,
    isYou: groupLeaderboard[2].id === user?.id,
    id: groupLeaderboard[2].id,
    exactCount: groupLeaderboard[2].exactCount,
    correctCount: groupLeaderboard[2].correctCount,
    championPick: null,
  } : undefined;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Inicia sesión para crear un grupo.");
      return;
    }
    const name = newGroupName.trim();
    if (!name) {
      toast.error("El nombre del grupo es obligatorio.");
      return;
    }
    setIsSubmittingGroupAction(true);
    try {
      const newGroup = await groupsService.createGroup(name, user.id);
      toast.success(`¡Grupo "${newGroup.name}" creado con éxito!`);
      setNewGroupName("");
      setIsCreatingGroup(false);
      refetchGroups();
      setActiveGroupId(newGroup.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al crear el grupo.");
    } finally {
      setIsSubmittingGroupAction(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Inicia sesión para unirse a un grupo.");
      return;
    }
    const code = joinGroupCode.trim().toUpperCase();
    if (!code) {
      toast.error("El código de invitación es obligatorio.");
      return;
    }
    setIsSubmittingGroupAction(true);
    try {
      const joinedGroup = await groupsService.joinGroup(code, user.id);
      toast.success(`¡Te has unido al grupo "${joinedGroup.name}"!`);
      setJoinGroupCode("");
      setIsJoiningGroup(false);
      refetchGroups();
      setActiveGroupId(joinedGroup.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al unirse al grupo.");
    } finally {
      setIsSubmittingGroupAction(false);
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;
    const confirmLeave = window.confirm(`¿Estás seguro de que quieres salir del grupo "${groupName}"?`);
    if (!confirmLeave) return;

    try {
      await groupsService.leaveGroup(groupId, user.id);
      toast.success(`Has salido del grupo "${groupName}".`);
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
      refetchGroups();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al salir del grupo.");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("¡Código copiado al portapapeles!");
  };

  const [first, second, third, ...rest] = dynamicLeaderboard;

  const isCurrentlyLoading = matchesLoading || (matchesList.length > 0 && leaderboardLoading);

  if (isCurrentlyLoading) {
    return (
      <AppShell>
        <div className="flex h-[75vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-white/55">Cargando clasificación...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {activeGroupId ? (
        <header className="relative z-20 px-5 pt-[max(28px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setActiveGroupId(null)}
              title="Volver a mis grupos"
              className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition active:scale-90 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <ProfileDropdown />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Grupo Privado</span>
          <h1 className="font-display mt-1 text-5xl leading-none text-white truncate max-w-[320px]">
            {activeGroup?.name || "Cargando grupo..."}
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Clasificación interna e independiente
          </p>
        </header>
      ) : (
        <>
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
            {activeTab === "leaderboard" && isOriginalUser ? (
              <>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Ranking Global</span>
                <h1 className="font-display mt-1 text-5xl leading-none text-white">Clasificación</h1>
                <p className="mt-2 text-sm text-white/55">
                  {dynamicLeaderboard.length > 0 
                    ? `${dynamicLeaderboard.length} pronosticadores compitiendo en la quiniela` 
                    : "Compite con tus amigos en la quiniela"}
                </p>
              </>
            ) : activeTab === "groups" ? (
              <>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Mis Quinielas</span>
                <h1 className="font-display mt-1 text-5xl leading-none text-white font-black uppercase">Grupos</h1>
                <p className="mt-2 text-sm text-white/55">
                  Compite en salas privadas exclusivas con tus amigos
                </p>
              </>
            ) : (
              <>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Premios</span>
                <h1 className="font-display mt-1 text-5xl leading-none text-white">Otros Premios</h1>
                <p className="mt-2 text-sm text-white/55">
                  Sorteos y recompensas exclusivas
                </p>
              </>
            )}
          </header>

          {/* Tabs Selector */}
          {dynamicLeaderboard.length > 0 && (
            <section className="mt-6 px-5">
              <div className="flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
                {isOriginalUser && (
                  <button
                    onClick={() => setActiveTab("leaderboard")}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                      activeTab === "leaderboard" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Trophy className="h-3.5 w-3.5" /> Ranking Global
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab("groups");
                    setActiveGroupId(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === "groups" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Grupos
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
        </>
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
      ) : activeTab === "groups" ? (
        <section className="mt-6 px-4 mb-20 space-y-6">
          {!user ? (
            // Mensaje para usuarios no autenticados
            <div className="glass rounded-3xl p-6 text-center py-12">
              <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <h4 className="font-display text-base text-white">Quinielas Privadas</h4>
              <p className="text-[11px] text-white/55 mt-2 max-w-[240px] mx-auto leading-relaxed">
                Debes iniciar sesión para poder crear tu propio grupo privado o unirte al de tus amigos.
              </p>
              <Link
                to="/profile"
                className="mt-6 inline-block w-full rounded-2xl bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 neon-glow text-center cursor-pointer"
              >
                Iniciar Sesión / Registrarse
              </Link>
            </div>
          ) : !activeGroupId ? (
            // VISTA: Listado de mis grupos
            <>
              {/* Botones de acción rápida */}
              <div className="grid grid-cols-2 gap-3 px-1">
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition active:scale-95 neon-glow cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Crear Grupo
                </button>
                <button
                  onClick={() => setIsJoiningGroup(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 py-3 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95 border border-white/5 cursor-pointer"
                >
                  <Users className="h-4 w-4" /> Unirme con Código
                </button>
              </div>

              {/* Lista de grupos */}
              <div className="space-y-3 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block px-1">Mis Grupos Privados</span>
                {userGroupsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-white/50">Cargando grupos...</span>
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="glass rounded-3xl p-6 text-center py-10">
                    <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <h4 className="font-display text-base text-white">Ningún grupo activo</h4>
                    <p className="text-[11px] text-white/55 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      Crea tu propia quiniela privada o únete a una con tus amigos usando un código de invitación.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {userGroups.map((group) => (
                      <div
                        key={group.id}
                        className="glass relative overflow-hidden rounded-3xl p-4 border border-white/5 flex flex-col gap-3.5"
                      >
                        <div className="flex items-start justify-between min-w-0">
                          <div>
                            <h4 className="font-display text-lg text-white truncate max-w-[200px]">{group.name}</h4>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-0.5">
                              {group.member_count} {group.member_count === 1 ? "miembro" : "miembros"}
                            </span>
                          </div>
                          
                          {/* Botón copiar código */}
                          <button
                            onClick={() => handleCopyCode(group.code)}
                            className="glass py-1.5 px-2.5 rounded-xl text-[10px] font-bold text-white/70 hover:text-white transition flex items-center gap-1 hover:bg-white/10 active:scale-95 cursor-pointer"
                            title="Copiar código de invitación"
                          >
                            <Clipboard className="h-3 w-3" /> {group.code}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => setActiveGroupId(group.id)}
                            className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition active:scale-[0.98] cursor-pointer text-center"
                          >
                            Ver Clasificación
                          </button>
                          <button
                            onClick={() => handleLeaveGroup(group.id, group.name)}
                            className="rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-red-400 transition active:scale-[0.98] cursor-pointer text-center"
                            title="Salir del grupo"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            // VISTA: Posiciones de un grupo privado
            <>
              {/* Tarjeta de información del grupo */}
              {activeGroup && (
                <div className="glass rounded-3xl p-4 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Código para compartir</span>
                    <button
                      onClick={() => handleCopyCode(activeGroup.code)}
                      className="mt-1 font-mono font-extrabold text-2xl text-gradient-gold tracking-widest flex items-center gap-1.5 hover:opacity-80 active:scale-95 transition"
                      title="Copiar código de invitación"
                    >
                      {activeGroup.code} <Clipboard className="h-4 w-4 text-white/40 inline" />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Participantes</span>
                    <span className="font-display text-2xl text-white mt-1 block">{activeGroup.member_count}</span>
                  </div>
                </div>
              )}

              {/* Podium del Grupo */}
              {!groupLeaderboardLoading && groupLeaderboard.length > 0 && (
                <section className="mt-4 px-1">
                  <div className="grid grid-cols-3 items-end gap-3">
                    <PodiumCard player={gSecond} place={2} height="h-36" onClick={() => gSecond && setSelectedUser(gSecond)} />
                    <PodiumCard player={gFirst} place={1} height="h-44" featured onClick={() => gFirst && setSelectedUser(gFirst)} />
                    <PodiumCard player={gThird} place={3} height="h-32" onClick={() => gThird && setSelectedUser(gThird)} />
                  </div>
                </section>
              )}

              {/* Tabla de clasificación del grupo */}
              <div className="glass overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white/55">
                  <span>Miembro</span>
                  <span>Puntos</span>
                </div>
                {groupLeaderboardLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-white/50">Cargando clasificación...</span>
                  </div>
                ) : groupLeaderboard.length === 0 ? (
                  <div className="py-10 text-center text-xs text-white/45 italic">No hay miembros registrados.</div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {groupLeaderboard.map((member) => {
                      const entryMock: LeaderboardEntry = {
                        rank: member.rank,
                        name: member.name,
                        country: member.country,
                        points: member.points,
                        accuracy: member.accuracy,
                        streak: 0,
                        isYou: member.id === user?.id,
                        id: member.id,
                        exactCount: member.exactCount,
                        correctCount: member.correctCount,
                        championPick: null,
                      };

                      return (
                        <li
                          key={member.id}
                          onClick={() => setSelectedUser(entryMock)}
                          className={`flex items-center justify-between px-5 py-3.5 transition cursor-pointer hover:bg-white/5 active:scale-[0.99] ${
                            member.id === user?.id ? "bg-primary/10 ring-1 ring-primary/30 hover:bg-primary/15" : ""
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`font-display w-6 text-base ${member.id === user?.id ? "text-primary" : "text-white/40"}`}>
                              {member.rank}
                            </span>
                            <Flag code={member.country} size={30} />
                            <div className="min-w-0">
                              <div className={`truncate font-semibold text-sm ${member.id === user?.id ? "text-primary" : "text-white"}`}>
                                {member.name}
                              </div>
                              <div className="text-[10px] text-white/55">
                                {member.accuracy}% prec. · {member.exactCount} exactos
                              </div>
                            </div>
                          </div>
                          <div className="font-display text-xl text-white">{member.points}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
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
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
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

            {/* Scrollable body wrapper to fit small screens */}
            <div className="mt-4 space-y-5 max-h-[58vh] overflow-y-auto pr-1 scrollbar-thin">
              {/* Puntuación */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Puntaje Total</span>
                <span className="font-display text-4xl text-primary mt-1 block">
                  {selectedUser.points} pts
                </span>
              </div>

              {/* Desglose de Puntos */}
              <div className="space-y-2.5">
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

              {/* Detalle de Puntos por Partido */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Puntos por Partido</span>
                {(() => {
                  const finishedMatches = matchesList.filter((m) => m.status === "finished");
                  if (finishedMatches.length === 0) {
                    return (
                      <div className="text-xs text-white/40 italic text-center py-3 bg-white/5 rounded-xl border border-white/5">
                        No hay partidos finalizados todavía.
                      </div>
                    );
                  }
                  
                  // Mapear partidos con sus respectivos puntos y fechas para ordenamiento
                  const sortedFinished = finishedMatches
                    .map((m) => {
                      const pred = selectedUser.predictions?.[m.id];
                      const pts = pred ? calculateMatchPoints(m, pred) : 0;
                      const dateStr = m.kickoff || "";
                      return {
                        match: m,
                        pts,
                        time: dateStr ? new Date(dateStr).getTime() : 0,
                      };
                    })
                    .sort((a, b) => {
                      if (a.pts !== b.pts) {
                        return b.pts - a.pts; // Aquellos con más puntos van arriba (ej. +3/+5 antes de +1)
                      }
                      return b.time - a.time; // Más nuevos primero dentro de cada grupo
                    });

                  return (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                      {sortedFinished.map(({ match: m, pts }) => {
                        const pred = selectedUser.predictions?.[m.id];
                        const exact = pred ? isPredictionExact(m, pred) : false;

                        return (
                          <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-[11px] gap-2">
                            {/* Teams & Flags */}
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <Flag code={m.home.code} size={14} className="shrink-0" />
                              <span className="font-semibold text-white/80 truncate text-[10px]">{m.home.short}</span>
                              <span className="text-white/35 text-[9px] shrink-0">vs</span>
                              <Flag code={m.away.code} size={14} className="shrink-0" />
                              <span className="font-semibold text-white/80 truncate text-[10px]">{m.away.short}</span>
                            </div>
                            
                            {/* Pred vs Real */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-black/20 px-2 py-0.5 rounded-lg text-[9px]">
                              <span className="text-white/40">Pred:</span>
                              <span className="text-white font-bold">{pred ? `${pred.home}-${pred.away}` : "-"}</span>
                              <span className="text-white/20">|</span>
                              <span className="text-white/40">Real:</span>
                              <span className="text-gradient-neon font-extrabold">{m.scoreHome}-{m.scoreAway}</span>
                            </div>

                            {/* Puntos Badge */}
                            <div className="shrink-0 text-right min-w-[50px]">
                              {pts > 0 ? (
                                <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide ${
                                  exact 
                                    ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/20" 
                                    : "bg-primary/15 text-primary ring-1 ring-primary/20"
                                }`}>
                                  +{pts} PTS
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide bg-white/5 text-white/35">
                                  0 PTS
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Premios y Logros */}
              <div className="space-y-2.5">
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
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-5 w-full rounded-2xl bg-white/10 hover:bg-white/15 py-3 text-xs font-bold uppercase tracking-widest text-white transition active:scale-95 shrink-0"
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}

      {/* Modal: Crear Grupo Privado */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-sm overflow-hidden rounded-3xl p-6 relative border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-xl text-white mb-1">Crear Grupo Privado</h3>
            <p className="text-xs text-white/50 mb-4">Crea una quiniela cerrada para competir con tu gente.</p>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Nombre del Grupo</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="ej. Los Galácticos de la Oficina"
                  maxLength={30}
                  className="w-full rounded-2xl bg-white/5 py-3 px-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                  required
                  disabled={isSubmittingGroupAction}
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  disabled={isSubmittingGroupAction}
                  className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroupAction}
                  className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 disabled:opacity-50 neon-glow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingGroupAction && <Loader2 className="h-3 w-3 animate-spin" />}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unirse con Código */}
      {isJoiningGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-sm overflow-hidden rounded-3xl p-6 relative border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display text-xl text-white mb-1">Unirme a un Grupo</h3>
            <p className="text-xs text-white/50 mb-4">Ingresa el código alfanumérico para ingresar a la quiniela privada.</p>
            
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Código de Invitación</label>
                <input
                  type="text"
                  value={joinGroupCode}
                  onChange={(e) => setJoinGroupCode(e.target.value)}
                  placeholder="ej. XF92JD"
                  maxLength={10}
                  className="w-full rounded-2xl bg-white/5 py-3 px-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition text-center font-mono font-bold tracking-widest uppercase"
                  required
                  disabled={isSubmittingGroupAction}
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoiningGroup(false)}
                  disabled={isSubmittingGroupAction}
                  className="flex-1 rounded-2xl bg-white/5 border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroupAction}
                  className="flex-1 rounded-2xl bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 disabled:opacity-50 neon-glow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingGroupAction && <Loader2 className="h-3 w-3 animate-spin" />}
                  Ingresar
                </button>
              </div>
            </form>
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
