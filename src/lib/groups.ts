import { supabase } from "./supabase";
import { calculateMatchPoints } from "./predictionsStore";

export type Group = {
  id: string;
  name: string;
  code: string;
  creator_id: string;
  created_at: string;
};

export type GroupMemberLeaderboardEntry = {
  rank: number;
  name: string;
  country: string;
  points: number;
  accuracy: number;
  exactCount: number;
  correctCount: number;
  id: string;
};

// Generar código de invitación aleatorio (6 letras/números en mayúscula)
function generateGroupCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const groupsService = {
  // 1. Crear un nuevo grupo privado
  async createGroup(name: string, userId: string): Promise<Group> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("El nombre del grupo es obligatorio.");

    // Intentar crear con un código único (hasta 5 intentos en caso de colisión extremadamente rara)
    let attempts = 0;
    let errorToThrow = null;

    while (attempts < 5) {
      const code = generateGroupCode();
      const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: cleanName,
          code,
          creator_id: userId,
        })
        .select()
        .single();

      if (!groupError && newGroup) {
        // Unirse automáticamente como creador
        const { error: memberError } = await supabase
          .from("group_members")
          .insert({
            group_id: newGroup.id,
            user_id: userId,
          });

        if (memberError) {
          // Si falla unirse, limpiar el grupo creado
          await supabase.from("groups").delete().eq("id", newGroup.id);
          throw memberError;
        }

        return newGroup as Group;
      }

      errorToThrow = groupError;
      attempts++;
    }

    throw errorToThrow || new Error("No se pudo generar un código único para el grupo.");
  },

  // 2. Unirse a un grupo privado existente mediante código
  async joinGroup(code: string, userId: string): Promise<Group> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error("El código de invitación es obligatorio.");

    // Buscar el grupo por código
    const { data: group, error: searchError } = await supabase
      .from("groups")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (searchError || !group) {
      throw new Error("No se encontró ningún grupo con ese código de invitación.");
    }

    // Agregar al usuario como miembro
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: userId,
      });

    if (joinError) {
      // Código de error para restricción única (ya es miembro)
      if (joinError.code === "23505") {
        throw new Error("Ya eres miembro de este grupo.");
      }
      throw joinError;
    }

    return group as Group;
  },

  // 3. Salir de un grupo privado
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  // 4. Obtener todos los grupos a los que pertenece el usuario
  async getUserGroups(userId: string): Promise<(Group & { member_count: number })[]> {
    // Obtener los grupos en los que participa el usuario
    const { data: membersData, error: membersError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (membersError) throw membersError;
    if (!membersData || membersData.length === 0) return [];

    const groupIds = membersData.map((m) => m.group_id);

    // Obtener los detalles de los grupos
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds);

    if (groupsError) throw groupsError;
    if (!groupsData) return [];

    // Obtener recuento de miembros para cada grupo
    const results = await Promise.all(
      groupsData.map(async (group) => {
        const { count, error: countError } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", group.id);

        return {
          ...(group as Group),
          member_count: countError ? 1 : (count || 1),
        };
      })
    );

    return results;
  },

  // 5. Calcular la clasificación privada de un grupo
  async getGroupLeaderboard(
    groupId: string,
    matchesList: any[]
  ): Promise<GroupMemberLeaderboardEntry[]> {
    // Obtener miembros del grupo
    const { data: members, error: mError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (mError) throw mError;
    if (!members || members.length === 0) return [];

    const userIds = members.map((m) => m.user_id);

    // Obtener perfiles de los miembros
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (pError) throw pError;
    if (!profiles || profiles.length === 0) return [];

    // Obtener predicciones de todos los miembros del grupo
    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("*")
      .in("user_id", userIds);

    if (predError) throw predError;

    // Listado de códigos de selección ordenados
    const sortedTeamCodes = [...profiles]
      .map((p) => p.country_code)
      .filter(Boolean);

    // Calcular puntos para cada miembro
    const entries: Omit<GroupMemberLeaderboardEntry, "rank">[] = profiles.map((profile) => {
      const userPreds = (predictions || []).filter((p) => p.user_id === profile.id);

      let pts = 0;
      let correct = 0;
      let exact = 0;
      let finishedPreds = 0;

      for (const m of matchesList) {
        const pred = userPreds.find((p) => p.match_id === m.id);
        if (pred) {
          if (m.status === "finished") {
            finishedPreds++;
            const matchPts = calculateMatchPoints(m, { home: pred.home_score, away: pred.away_score });
            pts += matchPts;
            if (pred.home_score === m.scoreHome && pred.away_score === m.scoreAway) {
              exact++;
              correct++;
            } else if (m.scoreHome !== undefined && m.scoreAway !== undefined) {
              const predOutcome = Math.sign(pred.home_score - pred.away_score);
              const realOutcome = Math.sign(m.scoreHome - m.scoreAway);
              if (predOutcome === realOutcome) {
                correct++;
              }
            }
          }
        }
      }

      // Campeón Pick Points
      const dbChampionRow = userPreds.find((p) => p.match_id === "champion");
      let championCode = null;
      if (dbChampionRow) {
        // Intentar mapear index a código
        championCode = sortedTeamCodes[dbChampionRow.home_score] || null;
      }

      const finalMatch = matchesList.find((m: any) => m.stage === "final");
      if (finalMatch && finalMatch.status === "finished" && finalMatch.scoreHome != null && finalMatch.scoreAway != null) {
        let winnerCode = "";
        if (finalMatch.scoreHome > finalMatch.scoreAway) {
          winnerCode = finalMatch.home.code;
        } else if (finalMatch.scoreAway > finalMatch.scoreHome) {
          winnerCode = finalMatch.away.code;
        }
        if (winnerCode && winnerCode === championCode) {
          pts += 20;
        }
      }

      const accuracy = finishedPreds > 0 ? Math.round((correct / finishedPreds) * 100) : 0;

      return {
        id: profile.id,
        name: profile.full_name || profile.username || "Usuario sin nombre",
        country: profile.country_code || "cr",
        points: pts,
        accuracy,
        exactCount: exact,
        correctCount: Math.max(0, correct - exact),
      };
    });

    // Ordenar clasificación: puntos desc, precisión desc, nombre asc
    return entries
      .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || a.name.localeCompare(b.name))
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
  },
};
