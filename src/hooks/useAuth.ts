import * as React from "react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { predictionsStore } from "@/lib/predictionsStore";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  country_code: string;
  points: number;
  accuracy: number;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Función síncrona para obtener el usuario de localStorage o cookies al inicio
const getInitialUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    // 1. Intentar leer de localStorage
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    let item: string | null = null;
    
    if (authKey) {
      item = localStorage.getItem(authKey);
    }
    
    // 2. Si no se encontró, intentar leer de cookies
    if (!item) {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const c = cookies[i].trim();
        const eqIdx = c.indexOf("=");
        if (eqIdx > 0) {
          const k = decodeURIComponent(c.substring(0, eqIdx).trim());
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
            item = decodeURIComponent(c.substring(eqIdx + 1).trim());
            // Sincronizar a localStorage para que el cliente de Supabase lo detecte inmediatamente
            try { localStorage.setItem(k, item); } catch {}
            break;
          }
        }
      }
    }

    if (item) {
      const parsed = JSON.parse(item);
      return parsed?.user || null;
    }
  } catch (e) {
    console.warn("[Auth] Error leyendo sesión inicial:", e);
  }
  return null;
};

// Determina el estado de carga inicial según la presencia de sesión local
const getInitialLoading = (): boolean => {
  if (typeof window === "undefined") return true;
  return getInitialUser() !== null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(getInitialLoading);
  const initializedRef = useRef(false);

  const fetchingProfileRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    if (profile && profile.id === userId) return;
    if (fetchingProfileRef.current === userId) return;
    fetchingProfileRef.current = userId;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("[Auth] No se encontró el perfil en la base de datos:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("[Auth] Error al obtener perfil de Supabase:", err);
      setProfile(null);
    } finally {
      fetchingProfileRef.current = null;
    }
  };

  const syncPredictions = async (userId: string) => {
    try {
      const { data: dbPreds, error } = await supabase
        .from("predictions")
        .select("match_id, home_score, away_score")
        .eq("user_id", userId);

      if (error) throw error;

      const local = predictionsStore.getAll();
      const map: Record<string, { home: number; away: number }> = {};
      if (dbPreds) {
        dbPreds.forEach((p) => {
          map[p.match_id] = { home: p.home_score, away: p.away_score };
        });
      }

      const toUpload: { user_id: string; match_id: string; home_score: number; away_score: number }[] = [];
      Object.entries(local).forEach(([matchId, p]) => {
        if (!map[matchId]) {
          map[matchId] = p;
          toUpload.push({
            user_id: userId,
            match_id: matchId,
            home_score: p.home,
            away_score: p.away,
          });
        }
      });

      if (toUpload.length > 0) {
        console.log("[Auth Sync] Subiendo predicciones locales a Supabase:", toUpload.length);
        await supabase.from("predictions").upsert(toUpload);
      }

      predictionsStore.setAll(map);
    } catch (err) {
      console.error("[Auth Sync] Error al sincronizar predicciones con Supabase:", err);
    }
  };

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      console.log("[Auth Event]:", event, session?.user?.id);

      const currentUser = session?.user ?? null;

      // Si aún no hemos completado la carga inicial (getSession) y el evento es nulo (sin usuario),
      // ignoramos el evento para no desloguear transitoriamente el estado síncrono inicial.
      if (!currentUser && !initializedRef.current) {
        console.log("[Auth] Ignorando deslogueo/sesión nula transitoria durante la hidratación inicial");
        return;
      }

      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        // Sincronización en segundo plano sin bloquear la carga inicial
        syncPredictions(currentUser.id).catch(err =>
          console.error("[Auth] Error en sync predictions de fondo:", err)
        );
        await fetchProfile(currentUser.id);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        predictionsStore.clear();
        setLoading(false);
      }
    });

    // 2. Esperar a que Supabase resuelva la sesión (incluyendo cualquier refresh pendiente)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      console.log("[Auth Initial Session Resolved]:", session?.user?.id);
      
      initializedRef.current = true;
      const currentUser = session?.user ?? null;

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else {
        setUser(currentUser);
        await fetchProfile(currentUser.id);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, loading, refreshProfile } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
