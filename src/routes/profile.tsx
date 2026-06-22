import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Share2, LogOut, Lock, Mail, User as UserIcon, Flag as FlagIcon, Eye, EyeOff, ChevronRight, Trophy, Menu, BookOpen, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/Flag";
import { fetchRealGroupsAndMatches } from "@/lib/api-football";
import { calculateUserStats, predictionsStore } from "@/lib/predictionsStore";
import { getDynamicLeaderboard } from "@/data/leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { allGroupTeams } from "@/data";
import { groups as staticGroups } from "@/data/groups";
import { matches as staticMatches } from "@/data/matches";
import { toast } from "sonner";
import { useSidebar } from "@/contexts/SidebarContext";
import { ProfileDropdown } from "@/components/ProfileDropdown";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil · Golazo" },
      { name: "description", content: "Tu identidad futbolera, estadísticas y logros de la quiniela." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { open: openSidebar } = useSidebar();
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("cr");
  const [submitting, setSubmitting] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: apiData } = useQuery({
    queryKey: ["realMatchesAndGroups"],
    queryFn: fetchRealGroupsAndMatches,
    retry: 2,
    retryDelay: 2000,
    staleTime: 0,
    gcTime: 0,
  });

  const matchesList = apiData?.matches || staticMatches;
  const groupsList = apiData?.groups || staticGroups;
  const userPredictions = predictionsStore.getAll();
  const dynamicStats = calculateUserStats(matchesList, profile?.country_code);
  const leaderboardList = getDynamicLeaderboard(matchesList);
  
  // Encontrar la posición del usuario en el leaderboard dinámico
  const userRank = user 
    ? leaderboardList.find(p => p.id === user.id)?.rank || 1 
    : 1;

  const s = {
    predictions: user ? dynamicStats.predictions : 0,
    correct: user ? dynamicStats.correct : 0,
    exact: user ? dynamicStats.exact : 0,
    accuracy: user ? dynamicStats.accuracy : 0,
    points: user ? dynamicStats.points : 0,
    rank: user ? userRank : "--",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("¡Sesión iniciada con éxito!");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error("Error al iniciar sesión: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username || !fullName) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
            full_name: fullName.trim(),
            country_code: countryCode,
          },
        },
      });
      if (error) throw error;
      
      if (data?.session) {
        toast.success("¡Cuenta creada y sesión iniciada!");
        navigate({ to: "/" });
      } else {
        toast.success("¡Cuenta creada! Ya puedes iniciar sesión con tus credenciales.");
        setTab("login");
      }
    } catch (err: any) {
      toast.error("Error al registrarse: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.info("Sesión cerrada");
    } catch (err) {
      console.error(err);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/profile",
      });
      if (error) throw error;
      toast.success("¡Correo de recuperación enviado! Revisa tu bandeja de entrada.");
      setTab("login");
    } catch (err: any) {
      toast.error("Error al enviar el correo: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSubmittingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("¡Contraseña actualizada con éxito!");
      setNewPassword("");
    } catch (err: any) {
      toast.error("Error al actualizar la contraseña: " + (err.message || err));
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo y tamaño (máx 2MB)
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Subir al bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Guardar en profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl + `?t=${Date.now()}` })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("¡Foto de perfil actualizada!");
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir la imagen: " + (err.message || err));
    } finally {
      setUploadingAvatar(false);
      // Limpiar input para permitir re-subir la misma imagen
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-white/55">Cargando perfil...</span>
        </div>
      </AppShell>
    );
  }

  // ── PANTALLA DE AUTH (Si no está logueado) ───────────────────────────────────
  if (!user) {
    return (
      <AppShell>
        <header className="px-5 pt-[max(28px,env(safe-area-inset-top))] text-center relative">
          <div className="absolute left-5 top-[max(28px,env(safe-area-inset-top))]">
            <button
              onClick={openSidebar}
              title="Menú"
              className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition"
            >
              <Menu className="h-4 w-4 text-white" />
            </button>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary block mt-1">Únete a Golazo</span>
          <h1 className="font-display mt-1 text-5xl leading-none text-white">Tu Quiniela</h1>
          <p className="mt-2 text-sm text-white/55">Inicia sesión o crea tu cuenta para guardar predicciones y competir.</p>
        </header>

        <div className="mt-8 px-4">
          {/* Selector de pestañas */}
          <div className="flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10 mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                tab === "login" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                tab === "register" ? "bg-white text-black font-extrabold" : "text-white/60 hover:text-white"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <div className="glass p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            
            {tab === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="font-display text-lg text-white">Recuperar Contraseña</h3>
                  <p className="text-xs text-white/55 mt-1">Te enviaremos un correo para que puedas restablecerla.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 disabled:opacity-50 neon-glow mt-4"
                >
                  {submitting ? "Enviando..." : "Enviar Correo"}
                </button>

                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="w-full text-center text-xs text-white/50 hover:text-white transition mt-2 block"
                >
                  Volver al Inicio de Sesión
                </button>
              </form>
            ) : tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => setTab("forgot")}
                      className="text-[10px] uppercase tracking-widest text-primary font-semibold hover:underline"
                    >
                      ¿La olvidaste?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-12 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 z-10 text-white/70 hover:text-primary transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 disabled:opacity-50 neon-glow mt-4"
                >
                  {submitting ? "Cargando..." : "Ingresar"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Apodo / Nombre de Usuario</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ej. golazo_campeon"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Nombre Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ej. Alejandro Gómez"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Selección Favorita</label>
                  <div className="relative">
                    <FlagIcon className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full rounded-2xl bg-[#11171d] py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
                    >
                      {allGroupTeams()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((team) => (
                          <option key={team.code} value={team.code} className="bg-background">
                            {team.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-12 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 z-10 text-white/70 hover:text-primary transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 disabled:opacity-50 neon-glow mt-4"
                >
                  {submitting ? "Creando cuenta..." : "Registrarse"}
                </button>
              </form>
            )}
          </div>
          
          {/* Enlaces de ayuda para no logueados */}
          <div className="mt-8 mb-10 flex justify-center gap-6 text-xs text-white/40">
            <Link to="/rules" search={{ tab: "manual" }} className="hover:text-primary transition font-semibold">
              Manual de Juego
            </Link>
            <span>•</span>
            <Link to="/rules" search={{ tab: "terms" }} className="hover:text-primary transition font-semibold">
              Términos
            </Link>
            <span>•</span>
            <Link to="/rules" search={{ tab: "privacy" }} className="hover:text-primary transition font-semibold">
              Privacidad
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── PERFIL DEL USUARIO LOGUEADO ─────────────────────────────────────────────
  const displayProfile = profile || {
    full_name: user.email?.split("@")[0] || "Usuario",
    username: user.email?.split("@")[0] || "usuario",
    country_code: "cr",
  };

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative px-5 pt-[max(28px,env(safe-area-inset-top))]">
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={openSidebar}
              title="Menú"
              className="glass grid h-9 w-9 place-items-center rounded-full hover:bg-white/15 transition"
            >
              <Menu className="h-4 w-4 text-white" />
            </button>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Mi Identidad</span>
          </div>
          <ProfileDropdown />
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          {/* Avatar con botón de upload */}
          <div className="relative">
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative block rounded-full focus:outline-none active:scale-95 transition"
              title="Cambiar foto de perfil"
            >
              {displayProfile.avatar_url ? (
                <img
                  src={displayProfile.avatar_url}
                  alt="Avatar"
                  className="h-[120px] w-[120px] rounded-full object-cover ring-4 ring-primary/40 neon-glow"
                />
              ) : (
                <Flag code={displayProfile.country_code} size={120} className="ring-4 ring-primary/40 neon-glow" />
              )}
              {/* Overlay spinner mientras sube */}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </button>

            {/* Badge cámara permanente — siempre visible en esquina inferior derecha */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-3 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-2 ring-background neon-glow transition active:scale-90 disabled:opacity-50"
              title="Cambiar foto"
            >
              {uploadingAvatar ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <svg className="h-4 w-4 text-black" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              )}
            </button>

            {/* Input oculto de archivo */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground animate-float">
              #{s.rank}
            </span>
          </div>
          <h1 className="font-display mt-5 text-4xl leading-none text-white">{displayProfile.full_name}</h1>
          <p className="mt-1 text-sm text-white/55">@{displayProfile.username} · Cuenta Sincronizada</p>

          <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black active:scale-95">
            <Share2 className="h-3.5 w-3.5" /> Compartir Perfil
          </button>
        </div>
      </section>

      {/* Stats grid */}
      <section className="mt-8 px-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Puntos" value={s.points} accent="neon" />
          <Stat label="Predicciones" value={s.predictions} />
          <Stat label="Aciertos" value={s.correct} />
          <Stat label="Marcadores Exactos" value={s.exact} accent="gold" />
          <Stat label="Precisión" value={`${s.accuracy}%`} accent="neon" />
          <Stat label="Posición" value={`#${s.rank}`} accent="gold" />
        </div>
      </section>

      {/* Accuracy bar */}
      <section className="mt-6 px-4">
        <div className="glass rounded-3xl p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/50">Precisión de Predicciones</div>
              <div className="font-display text-4xl text-gradient-neon">{s.accuracy}%</div>
            </div>
            <div className="text-xs text-white/55">{s.correct} de {s.predictions} aciertos</div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.7_0.2_180)]"
              style={{ width: `${s.accuracy}%` }}
            />
          </div>
        </div>
      </section>

      {/* Historial Completo de Pronósticos */}
      <section className="mt-8 px-4">
        <Link
          to="/my-predictions"
          className="glass-strong relative flex items-center gap-4 overflow-hidden rounded-3xl p-5 transition active:scale-[0.99] hover:bg-white/5"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,oklch(0.86_0.22_152/0.18),transparent_60%)]" />
          <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.7_0.2_180)]">
            <Trophy className="h-6 w-6 text-black" strokeWidth={2} />
          </div>
          <div className="relative flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Historial y Comparador</div>
            <div className="font-display text-xl text-white mt-0.5">Mis Pronósticos Guardados</div>
            <div className="text-xs text-white/55 mt-0.5">
              Revisa tus predicciones y compáralas frente a los marcadores reales.
            </div>
          </div>
          <ChevronRight className="relative h-5 w-5 text-white/50" />
        </Link>
      </section>

      {/* Achievements */}
      <section className="mt-6 px-4">
        <h2 className="mb-3 px-1 font-display text-2xl text-white">Logros</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass relative overflow-hidden rounded-2xl p-4">
            <div className="text-3xl">⚽</div>
            <div className="mt-2 font-display text-lg text-white">Primer Gol</div>
            <div className="text-[11px] text-white/55">Hiciste tu primera predicción</div>
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/15 blur-2xl" />
          </div>
          <div className="glass relative overflow-hidden rounded-2xl p-4 opacity-50">
            <div className="text-3xl">🎯</div>
            <div className="mt-2 font-display text-lg text-white">Hat-Trick</div>
            <div className="text-[11px] text-white/55">3 marcadores exactos seguidos</div>
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/15 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Reglamentos e Información */}
      <section className="mt-8 px-4">
        <h2 className="mb-3 px-1 font-display text-2xl text-white">Ayuda e Información</h2>
        <div className="glass rounded-3xl p-2 space-y-1">
          <Link
            to="/rules"
            search={{ tab: "manual" }}
            className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold text-white">Manual y Premios de Juego</div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </Link>
          <Link
            to="/rules"
            search={{ tab: "terms" }}
            className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold text-white">Términos y Condiciones</div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </Link>
          <Link
            to="/rules"
            search={{ tab: "privacy" }}
            className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold text-white">Política de Privacidad</div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </Link>
        </div>
      </section>

      {/* Seguridad / Cambiar Contraseña */}
      <section className="mt-8 px-4 mb-10">
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <h3 className="font-display text-2xl text-white mb-1">Seguridad</h3>
          <p className="text-xs text-white/50 mb-4">Actualiza tu contraseña para mantener tu cuenta segura.</p>
          
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/50 block font-semibold">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/40" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-2xl bg-white/5 py-3 pl-11 pr-12 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-3.5 z-10 text-white/70 hover:text-primary transition"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition active:scale-95 disabled:opacity-50 neon-glow mt-2"
            >
              {submittingPassword ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: "neon" | "gold" }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div
        className={`font-display text-2xl ${
          accent === "neon" ? "text-gradient-neon" : accent === "gold" ? "text-gradient-gold" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}
