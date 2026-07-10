import { Link } from "@tanstack/react-router";
import {
  X,
  Home,
  Trophy,
  User,
  BookOpen,
  FileText,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Flag } from "./Flag";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Soccer ball icon
function Ball({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3l3 4-1.5 5h-3L9 7z" />
      <path d="M3.5 10l3.5 2 2 5-2 2.5" />
      <path d="M20.5 10L17 12l-2 5 2 2.5" />
      <path d="M9 7L5 8.5" />
      <path d="M15 7l4 1.5" />
    </svg>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayUser = mounted ? user : null;
  const displayProfile = mounted ? profile : null;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.info("Sesión cerrada correctamente");
      onClose();
    } catch (err: any) {
      toast.error("Error al cerrar sesión: " + (err.message || err));
    }
  };

  interface NavItem {
    to: string;
    label: string;
    Icon: any;
    isSpecial?: boolean;
  }

  const navItems: NavItem[] = [
    { to: "/", label: "Inicio", Icon: Home },
    { to: "/matches", label: "Partidos", Icon: Ball },
    { to: "/ranking", label: "Ranking", Icon: Trophy },
    { to: "/profile", label: "Mi Perfil", Icon: User },
    { to: "/my-predictions", label: "Mis Pronósticos", Icon: FileText },
    { to: "/champion", label: "Campeón Mundial", Icon: Trophy, isSpecial: true },
  ];

  const legalItems = [
    { to: "/rules", search: { tab: "manual" }, label: "Manual de Juego", Icon: BookOpen },
    { to: "/rules", search: { tab: "terms" }, label: "Términos y Condiciones", Icon: FileText },
    { to: "/rules", search: { tab: "privacy" }, label: "Privacidad", Icon: ShieldCheck },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 w-[280px] bg-[#0a0f14] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/ball.png" alt="Golazo" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <span className="font-display text-lg tracking-wide text-white block leading-none">
                GOLAZO
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/40">
                Mundial 2026
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Middle Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
          {/* User Profile Card */}
          {displayUser ? (
            <div className="glass p-4 rounded-2xl flex items-center gap-3">
              {displayProfile?.avatar_url ? (
                <img
                  src={displayProfile.avatar_url}
                  alt="Avatar"
                  className="h-[42px] w-[42px] rounded-full object-cover ring-2 ring-primary/30"
                />
              ) : (
                <Flag
                  code={displayProfile?.country_code || "cr"}
                  size={42}
                  className="ring-2 ring-primary/30"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="block font-semibold text-white truncate leading-tight">
                  {displayProfile?.full_name || displayUser.email?.split("@")[0]}
                </span>
                <span className="block text-[11px] text-white/50 truncate">
                  @{displayProfile?.username || "usuario"}
                </span>
              </div>
              <Link
                to="/profile"
                onClick={onClose}
                className="text-primary hover:text-primary-foreground p-1 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="glass p-4 rounded-2xl text-center">
              <span className="font-display text-base text-white block">
                Participa en la Quiniela
              </span>
              <p className="text-[11px] text-white/50 mt-1">
                Guarda tus pronósticos en tiempo real y entra al ranking.
              </p>
              <Link
                to="/profile"
                onClick={onClose}
                className="mt-3 block w-full rounded-xl bg-primary py-2 text-center text-xs font-bold uppercase tracking-wider text-primary-foreground transition active:scale-95"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-2">
              Navegación
            </span>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-white/5 ${
                  item.isSpecial ? "text-gradient-gold" : "text-white/80 hover:text-white"
                }`}
              >
                <item.Icon
                  className={`h-4.5 w-4.5 ${item.isSpecial ? "text-[oklch(0.85_0.16_85)]" : "text-white/50"}`}
                />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Campeonato Nacional Block */}
          <div className="space-y-1">
            <span className="px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-2">
              Campeonato Nacional
            </span>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-4.5 w-4.5 text-white/50" />
                <span>Predicción Nacional</span>
              </div>
              <span className="text-[8px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-md font-extrabold">
                Próximamente
              </span>
            </Link>
          </div>

          {/* Legal / Rules Section */}
          <div className="space-y-1">
            <span className="px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-2">
              Reglamento y Ayuda
            </span>
            {legalItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={item.search}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition hover:bg-white/5"
              >
                <item.Icon className="h-4.5 w-4.5 text-white/50" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Settings Block */}
          <div className="space-y-1">
            <span className="px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-2">
              Configuración
            </span>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition hover:bg-white/5"
            >
              <Settings className="h-4.5 w-4.5 text-white/50" />
              <span>Configuración de la app</span>
            </Link>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="p-4 border-t border-white/10">
          {displayUser ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition"
            >
              <LogOut className="h-4 w-4" /> Cerrar Sesión
            </button>
          ) : (
            <div className="text-center text-[10px] text-white/30">Golazo Quiniela © 2026</div>
          )}
        </div>
      </aside>
    </>
  );
}
