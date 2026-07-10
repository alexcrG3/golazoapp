import { teams, type Team, teamByCode } from "./teams";

export type Group = {
  name: string; // "A" .. "L"
  teamCodes: string[]; // 4 codes
};

// 12 grupos × 4 equipos = 48 — Datos oficiales FIFA Mundial 2026
export const groups: Group[] = [
  { name: "A", teamCodes: ["mx", "za", "kr", "cz"] }, // México, Sudáfrica, Corea del Sur, Rep. Checa
  { name: "B", teamCodes: ["ca", "ba", "qa", "ch"] }, // Canadá, Bosnia, Qatar, Suiza
  { name: "C", teamCodes: ["br", "ma", "ht", "gb-sct"] }, // Brasil, Marruecos, Haití, Escocia
  { name: "D", teamCodes: ["us", "py", "au", "tr"] }, // Estados Unidos, Paraguay, Australia, Turquía
  { name: "E", teamCodes: ["de", "cw", "ci", "ec"] }, // Alemania, Curazao, Costa de Marfil, Ecuador
  { name: "F", teamCodes: ["nl", "jp", "se", "tn"] }, // Países Bajos, Japón, Suecia, Túnez
  { name: "G", teamCodes: ["be", "eg", "ir", "nz"] }, // Bélgica, Egipto, Irán, Nueva Zelanda
  { name: "H", teamCodes: ["es", "cv", "sa", "uy"] }, // España, Cabo Verde, Arabia Saudita, Uruguay
  { name: "I", teamCodes: ["fr", "sn", "iq", "no"] }, // Francia, Senegal, Iraq, Noruega
  { name: "J", teamCodes: ["ar", "dz", "at", "jo"] }, // Argentina, Argelia, Austria, Jordania
  { name: "K", teamCodes: ["pt", "cd", "uz", "co"] }, // Portugal, Congo, Uzbekistán, Colombia
  { name: "L", teamCodes: ["gb-eng", "hr", "gh", "pa"] }, // Inglaterra, Croacia, Ghana, Panamá
];

// Sanity: garantizar 48 equipos únicos en grupos
export const groupTeams = (g: Group): Team[] => g.teamCodes.map(teamByCode);

export const allGroupTeams = (): Team[] => groups.flatMap(groupTeams);

// Validación dev-only
if (typeof window !== "undefined") {
  const codes = groups.flatMap((g) => g.teamCodes);
  const unique = new Set(codes);
  if (codes.length !== 48 || unique.size !== 48) {
    // eslint-disable-next-line no-console
    console.warn(
      "[groups] Se esperaban 48 equipos únicos; hay",
      codes.length,
      "y",
      unique.size,
      "únicos",
    );
  }
}

export { teams };
