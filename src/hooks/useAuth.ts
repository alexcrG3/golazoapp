import { useEffect, useState } from "react";
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

    // Obtener sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          syncPredictions(session.user.id)
        ]);
      }
      setLoading(false);
    });

    // Escuchar cambios de estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      console.log("[Auth Change Event]:", event);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setLoading(true);
        await Promise.all([
          fetchProfile(session.user.id),
          syncPredictions(session.user.id)
        ]);
        setLoading(false);
      } else {
        setProfile(null);
        predictionsStore.clear(); // Limpiar store local al cerrar sesión
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

  return {
    user,
    profile,
    loading,
    refreshProfile,
  };
}

