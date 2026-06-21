import { useEffect, useRef, useState } from "react";
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Flag: true una vez que getSession() termina de leer localStorage
  const initializedRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("No se encontró el perfil en la base de datos:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error al obtener perfil de Supabase:", err);
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

      // Combinar locales que no estén en la base de datos
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
        console.log("[Sync] Subiendo predicciones locales a Supabase:", toUpload.length);
        await supabase.from("predictions").upsert(toUpload);
      }

      predictionsStore.setAll(map);
    } catch (err) {
      console.error("Error al sincronizar predicciones con Supabase:", err);
    }
  };

  useEffect(() => {
    let active = true;

    // 1. Suscribirse a cambios de auth PRIMERO (antes de getSession)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      console.log("[Auth Change Event]:", event);

      // ⚠️ Durante la hidratación SSR, Supabase puede emitir un SIGNED_OUT
      // antes de que getSession() lea el token de localStorage.
      // Lo ignoramos hasta que la inicialización esté completa.
      if (event === "SIGNED_OUT" && !initializedRef.current) {
        console.log("[Auth] Ignorando SIGNED_OUT durante hidratación inicial");
        return;
      }

      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          syncPredictions(session.user.id),
        ]);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        // Solo limpiar si es un logout explícito del usuario
        setProfile(null);
        predictionsStore.clear();
        setLoading(false);
      }
    });

    // 2. Leer sesión guardada en localStorage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      initializedRef.current = true; // Marcamos que ya leímos localStorage

      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          syncPredictions(session.user.id),
        ]);
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

  return {
    user,
    profile,
    loading,
    refreshProfile,
  };
}
