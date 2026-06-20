import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Trophy, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Flag } from "./Flag";

// Soccer ball icon (lucide doesn't ship one consistently)
function Ball({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3l3 4-1.5 5h-3L9 7z" />
      <path d="M3.5 10l3.5 2 2 5-2 2.5" />
      <path d="M20.5 10L17 12l-2 5 2 2.5" />
      <path d="M9 7L5 8.5" />
      <path d="M15 7l4 1.5" />
    </svg>
  );
}

const navItems = [
  { to: "/", label: "Inicio", Icon: Home },
  { to: "/matches", label: "Partidos", Icon: Ball },
  { to: "/ranking", label: "Ranking", Icon: Trophy },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile } = useAuth();

  const profileActive = pathname.startsWith("/profile") || pathname.startsWith("/my-predictions") || pathname.startsWith("/rules");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#070b0e]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center justify-between gap-1">
        {navItems.map(({ to, label, Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="group relative flex flex-1 flex-col items-center gap-1 py-1.5 transition"
            >
              {active && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary neon-glow" />
              )}
              <Icon
                className={`h-5.5 w-5.5 transition-all duration-300 ${
                  active
                    ? "text-primary drop-shadow-[0_0_8px_oklch(0.86_0.22_152/0.5)] scale-105"
                    : "text-white/50 group-hover:text-white/80"
                }`}
              />
              <span
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  active ? "text-primary" : "text-white/40 group-hover:text-white/60"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Perfil tab — shows flag avatar when logged in */}
        <Link
          to="/profile"
          className="group relative flex flex-1 flex-col items-center gap-1 py-1.5 transition"
        >
          {profileActive && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary neon-glow" />
          )}
          {user && profile ? (
            <Flag
              code={profile.country_code || "cr"}
              size={22}
              className={`transition-all duration-300 ${
                profileActive
                  ? "ring-2 ring-primary drop-shadow-[0_0_8px_oklch(0.86_0.22_152/0.5)] scale-105"
                  : "opacity-60 group-hover:opacity-90"
              }`}
            />
          ) : (
            <User
              className={`h-5.5 w-5.5 transition-all duration-300 ${
                profileActive
                  ? "text-primary drop-shadow-[0_0_8px_oklch(0.86_0.22_152/0.5)] scale-105"
                  : "text-white/50 group-hover:text-white/80"
              }`}
            />
          )}
          <span
            className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${
              profileActive ? "text-primary" : "text-white/40 group-hover:text-white/60"
            }`}
          >
            Perfil
          </span>
        </Link>
      </div>
    </nav>
  );
}
