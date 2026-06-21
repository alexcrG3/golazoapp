import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { User, LogOut, BookOpen, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Flag } from "./Flag";

export function ProfileDropdown() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <Link to="/profile" className="shrink-0 transition active:scale-95" title="Iniciar Sesión">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-2 ring-white/15 hover:bg-white/20 transition">
          <User className="h-4 w-4 text-white" />
        </div>
      </Link>
    );
  }

  const displayProfile = profile || {
    full_name: user.email?.split("@")[0] || "Usuario",
    username: user.email?.split("@")[0] || "usuario",
    country_code: "cr",
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await supabase.auth.signOut();
      navigate({ to: "/profile" });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón disparador (foto o bandera del perfil) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="shrink-0 transition active:scale-95 focus:outline-none flex items-center justify-center"
        title="Menú de perfil"
      >
        {displayProfile.avatar_url ? (
          <img
            src={displayProfile.avatar_url}
            alt="Avatar"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/40 hover:ring-primary/80 transition neon-glow-sm"
          />
        ) : (
          <Flag
            code={displayProfile.country_code}
            size={32}
            className="ring-2 ring-primary/40 hover:ring-primary/80 transition rounded-full"
          />
        )}
      </button>

      {/* Menú Desplegable con Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 z-50 w-64 rounded-2xl bg-[#0b1318]/95 backdrop-blur-xl border border-white/10 p-3.5 shadow-2xl shadow-black/80 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {/* Header con información de usuario */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="relative shrink-0">
              {displayProfile.avatar_url ? (
                <img
                  src={displayProfile.avatar_url}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <Flag code={displayProfile.country_code} size={36} className="ring-2 ring-white/10" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display text-sm font-bold text-white truncate">
                {displayProfile.full_name}
              </span>
              <span className="text-[10px] text-white/50 truncate">
                @{displayProfile.username}
              </span>
            </div>
          </div>

          {/* Divisor */}
          <div className="my-2.5 h-[1px] bg-white/10" />

          {/* Elementos del menú */}
          <div className="space-y-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition active:scale-[0.98]"
            >
              <User className="h-4 w-4 text-primary" />
              Mi Perfil
            </Link>

            <Link
              to="/rules"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              Reglamento
            </Link>

            {/* Divisor antes de Cerrar Sesión */}
            <div className="my-1.5 h-[1px] bg-white/10" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition active:scale-[0.98] text-left"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
