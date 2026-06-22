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

// Función síncrona para obtener el usuario de localStorage al inicio
const getInitialUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (authKey) {
      const item = localStorage.getItem(authKey);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed?.user || null;
      }
    }
  } catch (e) {
    console.warn("[Auth] Error leyendo sesión inicial de localStorage:", e);
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

  const fetchProfile = async (userId: string) => {
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

    // 1. Suscribirse a cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      console.log("[Auth Event]:", event);

      if (event === "SIGNED_OUT" && !initializedRef.current) {
        console.log("[Auth] Ignorando SIGNED_OUT durante la hidratación inicial");
        return;
      }

      const currentUser = session?.user ?? null;
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

    // 2. Leer sesión guardada de forma asíncrona para corroborar y actualizar
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      initializedRef.current = true;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        // Sincronización en segundo plano
        syncPredictions(currentUser.id).catch(err =>
          console.error("[Auth] Error en sync predictions de fondo:", err)
        );
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
