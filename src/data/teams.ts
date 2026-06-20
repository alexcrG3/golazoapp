export type Team = {
  code: string; // flagcdn code (ISO alpha-2 or special like "gb-eng")
  name: string;
  short: string;
  confederation: "CONMEBOL" | "CONCACAF" | "UEFA" | "CAF" | "AFC" | "OFC";
};

export const teams: Team[] = [
  // CONMEBOL
  { code: "ar", name: "Argentina", short: "ARG", confederation: "CONMEBOL" },
  { code: "br", name: "Brasil", short: "BRA", confederation: "CONMEBOL" },
  { code: "uy", name: "Uruguay", short: "URU", confederation: "CONMEBOL" },
  { code: "co", name: "Colombia", short: "COL", confederation: "CONMEBOL" },
  { code: "ec", name: "Ecuador", short: "ECU", confederation: "CONMEBOL" },
  { code: "cl", name: "Chile", short: "CHI", confederation: "CONMEBOL" },
  { code: "pe", name: "Perú", short: "PER", confederation: "CONMEBOL" },
  { code: "py", name: "Paraguay", short: "PAR", confederation: "CONMEBOL" },

  // CONCACAF
  { code: "mx", name: "México", short: "MEX", confederation: "CONCACAF" },
  { code: "us", name: "Estados Unidos", short: "EUA", confederation: "CONCACAF" },
  { code: "ca", name: "Canadá", short: "CAN", confederation: "CONCACAF" },
  { code: "cr", name: "Costa Rica", short: "CRC", confederation: "CONCACAF" },
  { code: "pa", name: "Panamá", short: "PAN", confederation: "CONCACAF" },
  { code: "jm", name: "Jamaica", short: "JAM", confederation: "CONCACAF" },
  { code: "hn", name: "Honduras", short: "HON", confederation: "CONCACAF" },

  // UEFA
  { code: "es", name: "España", short: "ESP", confederation: "UEFA" },
  { code: "fr", name: "Francia", short: "FRA", confederation: "UEFA" },
  { code: "de", name: "Alemania", short: "ALE", confederation: "UEFA" },
  { code: "gb-eng", name: "Inglaterra", short: "ING", confederation: "UEFA" },
  { code: "it", name: "Italia", short: "ITA", confederation: "UEFA" },
  { code: "pt", name: "Portugal", short: "POR", confederation: "UEFA" },
  { code: "nl", name: "Países Bajos", short: "NED", confederation: "UEFA" },
  { code: "be", name: "Bélgica", short: "BEL", confederation: "UEFA" },
  { code: "hr", name: "Croacia", short: "CRO", confederation: "UEFA" },
  { code: "ch", name: "Suiza", short: "SUI", confederation: "UEFA" },
  { code: "dk", name: "Dinamarca", short: "DIN", confederation: "UEFA" },
  { code: "pl", name: "Polonia", short: "POL", confederation: "UEFA" },
  { code: "rs", name: "Serbia", short: "SRB", confederation: "UEFA" },
  { code: "se", name: "Suecia", short: "SUE", confederation: "UEFA" },
  { code: "at", name: "Austria", short: "AUT", confederation: "UEFA" },

  // CAF
  { code: "ma", name: "Marruecos", short: "MAR", confederation: "CAF" },
  { code: "sn", name: "Senegal", short: "SEN", confederation: "CAF" },
  { code: "tn", name: "Túnez", short: "TUN", confederation: "CAF" },
  { code: "eg", name: "Egipto", short: "EGI", confederation: "CAF" },
  { code: "ng", name: "Nigeria", short: "NGA", confederation: "CAF" },
  { code: "cm", name: "Camerún", short: "CAM", confederation: "CAF" },
  { code: "gh", name: "Ghana", short: "GHA", confederation: "CAF" },
  { code: "ci", name: "Costa de Marfil", short: "CIV", confederation: "CAF" },
  { code: "dz", name: "Argelia", short: "ARG", confederation: "CAF" },

  // AFC
  { code: "jp", name: "Japón", short: "JPN", confederation: "AFC" },
  { code: "kr", name: "Corea del Sur", short: "KOR", confederation: "AFC" },
  { code: "sa", name: "Arabia Saudita", short: "KSA", confederation: "AFC" },
  { code: "ir", name: "Irán", short: "IRN", confederation: "AFC" },
  { code: "qa", name: "Catar", short: "QAT", confederation: "AFC" },
  { code: "au", name: "Australia", short: "AUS", confederation: "AFC" },
  { code: "ae", name: "Emiratos Árabes", short: "EAU", confederation: "AFC" },
  { code: "uz", name: "Uzbekistán", short: "UZB", confederation: "AFC" },

  // OFC
  { code: "nz", name: "Nueva Zelanda", short: "NZL", confederation: "OFC" },

  // Adicionales Mundial 2026
  { code: "za", name: "Sudáfrica", short: "RSA", confederation: "CAF" },
  { code: "cz", name: "Rep. Checa", short: "CZE", confederation: "UEFA" },
  { code: "ba", name: "Bosnia y Herz.", short: "BIH", confederation: "UEFA" },
  { code: "tr", name: "Turquía", short: "TUR", confederation: "UEFA" },
  { code: "ht", name: "Haití", short: "HAI", confederation: "CONCACAF" },
  { code: "gb-sct", name: "Escocia", short: "ESC", confederation: "UEFA" },
  { code: "no", name: "Noruega", short: "NOR", confederation: "UEFA" },
  { code: "cw", name: "Curazao", short: "CUR", confederation: "CONCACAF" },
  { code: "cv", name: "Cabo Verde", short: "CPV", confederation: "CAF" },
  { code: "cd", name: "Congo", short: "COD", confederation: "CAF" },
  { code: "iq", name: "Iraq", short: "IRQ", confederation: "AFC" },
  { code: "jo", name: "Jordania", short: "JOR", confederation: "AFC" },
];

export const teamByCode = (code: string): Team =>
  teams.find((t) => t.code === code) ?? {
    code: "tbd",
    name: "Por definir",
    short: "TBD",
    confederation: "UEFA",
  };

export const flagUrl = (code: string, size: 80 | 160 = 80) =>
  code === "tbd"
    ? `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23111'/><text x='50%' y='55%' font-family='sans-serif' font-size='28' fill='%2300d68f' text-anchor='middle'>?</text></svg>`
      )}`
    : `https://flagcdn.com/w${size}/${code}.png`;
