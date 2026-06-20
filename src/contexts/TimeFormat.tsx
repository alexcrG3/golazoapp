import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type TimeFormat = "12h" | "24h";

type Ctx = {
  format: TimeFormat;
  toggle: () => void;
  setFormat: (f: TimeFormat) => void;
};

const TimeFormatContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "golazo:timeFormat";

export function TimeFormatProvider({ children }: { children: ReactNode }) {
  const [format, setFormatState] = useState<TimeFormat>("12h");

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY) as TimeFormat | null;
      if (v === "12h" || v === "24h") setFormatState(v);
    } catch {}
  }, []);

  const setFormat = (f: TimeFormat) => {
    setFormatState(f);
    try { sessionStorage.setItem(STORAGE_KEY, f); } catch {}
  };
  const toggle = () => setFormat(format === "12h" ? "24h" : "12h");

  return (
    <TimeFormatContext.Provider value={{ format, toggle, setFormat }}>
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  const ctx = useContext(TimeFormatContext);
  if (!ctx) return { format: "12h" as TimeFormat, toggle: () => {}, setFormat: () => {} };
  return ctx;
}

export function formatTime(iso: string, format: TimeFormat): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
  });
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
}

export function isSameDay(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function TimeFormatToggle({ className = "" }: { className?: string }) {
  const { format, toggle } = useTimeFormat();
  return (
    <button
      onClick={toggle}
      aria-label="Cambiar formato de hora"
      className={`glass relative flex h-8 w-[88px] items-center rounded-full p-1 text-[10px] font-bold uppercase tracking-widest transition active:scale-95 ${className}`}
    >
      <span
        className={`absolute top-1 bottom-1 w-[40px] rounded-full bg-primary neon-glow transition-transform ${
          format === "24h" ? "translate-x-[40px]" : "translate-x-0"
        }`}
      />
      <span className={`relative z-10 flex-1 text-center ${format === "12h" ? "text-primary-foreground" : "text-white/60"}`}>
        AM/PM
      </span>
      <span className={`relative z-10 flex-1 text-center ${format === "24h" ? "text-primary-foreground" : "text-white/60"}`}>
        24h
      </span>
    </button>
  );
}
