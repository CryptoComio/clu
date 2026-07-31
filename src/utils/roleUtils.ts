import { ClubMember } from "../hooks/useClubData";

export interface ParsedRole {
  sigla: string;
  nomeCompleto: string;
}

export const translateRoleToItalian = (roleInput: string | number | undefined | null): string => {
  if (roleInput === undefined || roleInput === null) return "CC";
  
  // Se è un numero o stringa numerica (ID posizionamento ufficiale EA 0-28)
  const id = parseInt(String(roleInput));
  if (!isNaN(id) && id >= 0 && id <= 28) {
    switch (id) {
      case 0: return "POR"; // GK
      case 1: return "DC";  // SW
      case 2: return "TD";  // RWB
      case 3: return "TS";  // LWB
      case 4: return "TD";  // RB
      case 5: return "TS";  // LB
      case 6: return "DC";  // CB
      case 7: return "TD";  // RWB
      case 8: return "TS";  // LWB
      case 9: return "CDC"; // RDM -> CDC
      case 10: return "CDC"; // CDM
      case 11: return "CDC"; // LDM
      case 12: return "ED";  // RM
      case 13: return "CC";  // RCM -> CC
      case 14: return "CC";  // CM
      case 15: return "CC";  // LCM -> CC
      case 16: return "ES";  // LM
      case 17: return "COC"; // RAM -> COC
      case 18: return "COC"; // CAM
      case 19: return "COC"; // LAM -> COC
      case 20: return "AD";  // RF -> AD
      case 21: return "ATT"; // CF -> ATT
      case 22: return "AS";  // LF -> AS
      case 23: return "AD";  // RW
      case 24: return "ATT"; // ST
      case 25: return "AS";  // LW
      case 26: return "ATT"; // RS -> ATT
      case 27: return "ATT"; // LS -> ATT
      default: return "CC";
    }
  }

  const rawRole = String(roleInput).trim().toUpperCase();
  
  // Estrai eventuale sigla tra parentesi es. "Attaccante Centrale (ST)" -> "ST"
  const match = rawRole.match(/\(([^)]+)\)/);
  const sigla = match ? match[1].trim().toUpperCase() : rawRole;

  // Difesa
  if (["CB", "CENTER BACK", "DIFENSORE CENTRALE", "DC", "SW", "SWEEPER", "LIBERO"].includes(sigla)) return "DC";
  if (["LB", "LWB", "LEFT BACK", "LEFT WING BACK", "TERZINO SINISTRO", "TS", "ASA", "ESTERNO DIFENSIVO SINISTRO"].includes(sigla)) return "TS";
  if (["RB", "RWB", "RIGHT BACK", "RIGHT WING BACK", "TERZINO DESTRO", "TD", "ADA", "ESTERNO DIFENSIVO DESTRO"].includes(sigla)) return "TD";
  if (["DEFENDER", "DIFENSORE"].includes(sigla)) return "DC";

  // Centrocampo
  if (["CDM", "CENTRAL DEF MIDFIELDER", "CENTROCAMPISTA DIFENSIVO", "CDC"].includes(sigla)) return "CDC";
  if (["CM", "CENTRAL MIDFIELDER", "CENTROCAMPISTA CENTRALE", "CC"].includes(sigla)) return "CC";
  if (["CAM", "CENTRAL ATT MIDFIELDER", "CENTROCAMPISTA OFFENSIVO", "TREQUARTISTA", "COC"].includes(sigla)) return "COC";
  if (["LM", "LEFT MIDFIELDER", "ESTERNO SINISTRO", "ES"].includes(sigla)) return "ES";
  if (["RM", "RIGHT MIDFIELDER", "ESTERNO DESTRO", "ED"].includes(sigla)) return "ED";
  if (["MIDFIELDER", "CENTROCAMPISTA"].includes(sigla)) return "CC";

  // Attacco
  if (["LW", "LF", "LEFT WING", "LEFT FORWARD", "ALA SINISTRA", "AS"].includes(sigla)) return "AS";
  if (["RW", "RF", "RIGHT WING", "RIGHT FORWARD", "ALA DESTRA", "AD"].includes(sigla)) return "AD";
  if (["ST", "CF", "STRIKER", "CENTER FORWARD", "ATTACCANTE CENTRALE", "ATTACCANTE", "ATT", "AT", "SECONDA PUNTA", "RS", "LS"].includes(sigla)) return "ATT";
  if (["FORWARD", "ATTACCANTE"].includes(sigla)) return "ATT";

  // Porta
  if (["GK", "GOALKEEPER", "PORTIERE", "POR"].includes(sigla)) return "POR";

  return sigla;
};

export const parseAndTranslateRole = (rawRole: string, language: string = "it"): ParsedRole => {
  if (!rawRole) {
    return language === "it"
      ? { sigla: "N/D", nomeCompleto: "Non Definito" }
      : { sigla: "N/A", nomeCompleto: "Not Defined" };
  }

  if (language === "it") {
    const sigla = translateRoleToItalian(rawRole);
    const nomiCompletiIT: Record<string, string> = {
      "POR": "Portiere",
      "DC": "Difensore Centrale",
      "TS": "Terzino Sinistro",
      "TD": "Terzino Destro",
      "CDC": "Centrocampista Difensivo",
      "CC": "Centrocampista Centrale",
      "COC": "Trequartista",
      "ES": "Esterno Sinistro",
      "ED": "Esterno Destro",
      "AS": "Ala Sinistra",
      "AD": "Ala Destra",
      "ATT": "Attaccante"
    };
    return {
      sigla,
      nomeCompleto: nomiCompletiIT[sigla] || rawRole.split(" (")[0]
    };
  } else {
    const upperRole = rawRole.trim().toUpperCase();
    const match = rawRole.match(/\(([^)]+)\)/);
    const englishAbbr = match ? match[1].trim().toUpperCase() : upperRole;
    
    const roleMappingsEN: Record<string, { sigla: string; nomeCompleto: string }> = {
      "GK": { sigla: "GK", nomeCompleto: "Goalkeeper" },
      "GOALKEEPER": { sigla: "GK", nomeCompleto: "Goalkeeper" },
      "POR": { sigla: "GK", nomeCompleto: "Goalkeeper" },
      "PORTIERE": { sigla: "GK", nomeCompleto: "Goalkeeper" },
      "CB": { sigla: "CB", nomeCompleto: "Center Back" },
      "CENTER BACK": { sigla: "CB", nomeCompleto: "Center Back" },
      "DC": { sigla: "CB", nomeCompleto: "Center Back" },
      "LB": { sigla: "LB", nomeCompleto: "Left Back" },
      "LEFT BACK": { sigla: "LB", nomeCompleto: "Left Back" },
      "TS": { sigla: "LB", nomeCompleto: "Left Back" },
      "RB": { sigla: "RB", nomeCompleto: "Right Back" },
      "RIGHT BACK": { sigla: "RB", nomeCompleto: "Right Back" },
      "TD": { sigla: "RB", nomeCompleto: "Right Back" },
      "LWB": { sigla: "LWB", nomeCompleto: "Left Wing Back" },
      "ASA": { sigla: "LWB", nomeCompleto: "Left Wing Back" },
      "RWB": { sigla: "RWB", nomeCompleto: "Right Wing Back" },
      "ADA": { sigla: "RWB", nomeCompleto: "Right Wing Back" },
      "SW": { sigla: "CB", nomeCompleto: "Sweeper" },
      "CDM": { sigla: "CDM", nomeCompleto: "Central Def Midfielder" },
      "CDC": { sigla: "CDM", nomeCompleto: "Central Def Midfielder" },
      "CM": { sigla: "CM", nomeCompleto: "Central Midfielder" },
      "CC": { sigla: "CM", nomeCompleto: "Central Midfielder" },
      "LM": { sigla: "LM", nomeCompleto: "Left Midfielder" },
      "ES": { sigla: "LM", nomeCompleto: "Left Midfielder" },
      "RM": { sigla: "RM", nomeCompleto: "Right Midfielder" },
      "ED": { sigla: "RM", nomeCompleto: "Right Midfielder" },
      "CAM": { sigla: "CAM", nomeCompleto: "Central Att Midfielder" },
      "COC": { sigla: "CAM", nomeCompleto: "Central Att Midfielder" },
      "ST": { sigla: "ST", nomeCompleto: "Striker" },
      "STRIKER": { sigla: "ST", nomeCompleto: "Striker" },
      "ATT": { sigla: "ST", nomeCompleto: "Striker" },
      "CF": { sigla: "CF", nomeCompleto: "Center Forward" },
      "AT": { sigla: "CF", nomeCompleto: "Center Forward" },
      "LW": { sigla: "LW", nomeCompleto: "Left Wing" },
      "AS": { sigla: "LW", nomeCompleto: "Left Wing" },
      "RW": { sigla: "RW", nomeCompleto: "Right Wing" },
      "AD": { sigla: "RW", nomeCompleto: "Right Wing" },
      "DEFENDER": { sigla: "DEF", nomeCompleto: "Defender" },
      "DIFENSORE": { sigla: "DEF", nomeCompleto: "Defender" },
      "MIDFIELDER": { sigla: "MID", nomeCompleto: "Midfielder" },
      "CENTROCAMPISTA": { sigla: "MID", nomeCompleto: "Midfielder" },
      "FORWARD": { sigla: "FWD", nomeCompleto: "Forward" },
      "ATTACCANTE": { sigla: "FWD", nomeCompleto: "Forward" },
      "ATTACCANTE CENTRALE": { sigla: "ST", nomeCompleto: "Striker" },
      "CENTRAL MIDFIELDER": { sigla: "CM", nomeCompleto: "Central Midfielder" },
      "CENTRAL DEF MIDFIELDER": { sigla: "CDM", nomeCompleto: "Central Def Midfielder" },
      "CENTRAL ATT MIDFIELDER": { sigla: "CAM", nomeCompleto: "Central Att Midfielder" },
      "LEFT MIDFIELDER": { sigla: "LM", nomeCompleto: "Left Midfielder" },
      "RIGHT MIDFIELDER": { sigla: "RM", nomeCompleto: "Right Midfielder" },
      "LEFT WING": { sigla: "LW", nomeCompleto: "Left Wing" },
      "RIGHT WING": { sigla: "RW", nomeCompleto: "Right Wing" },
      "CENTER FORWARD": { sigla: "CF", nomeCompleto: "Center Forward" }
    };

    return roleMappingsEN[englishAbbr] || roleMappingsEN[upperRole] || { sigla: englishAbbr || "CM", nomeCompleto: rawRole.split(" (")[0] };
  }
};

export const getRoleCategoryName = (category: string, language: string): string => {
  if (language === "it") {
    switch (category) {
      case "goalkeeper": return "Portiere";
      case "defender": return "Difensore";
      case "midfielder": return "Centrocampista";
      case "forward": return "Attaccante";
      default: return "Giocatore";
    }
  } else {
    switch (category) {
      case "goalkeeper": return "Goalkeeper";
      case "defender": return "Defender";
      case "midfielder": return "Midfielder";
      case "forward": return "Forward";
      default: return "Player";
    }
  }
};

export const getFormattedRoleCategoryWithSigla = (rawRole: string, category: string, language: string): string => {
  const parsed = parseAndTranslateRole(rawRole, language);
  const categoryName = getRoleCategoryName(category, language);
  return `${categoryName} (${parsed.sigla})`;
};

export const groupPlayersByTacticalCategory = (players: ClubMember[]) => {
  const categories = {
    goalkeepers: [] as ClubMember[],
    defenders: [] as ClubMember[], // DC, TD/TS
    midfielders: [] as ClubMember[], // CDC, CC, ES/ED
    attackers: [] as ClubMember[] // COC, ATT, AT, AS/AD
  };

  players.forEach(player => {
    const parsed = parseAndTranslateRole(player.role);
    const sigla = parsed.sigla;

    if (sigla === "POR") {
      categories.goalkeepers.push(player);
    } else if (["DC", "TS", "TD", "ASA", "ADA"].includes(sigla)) {
      categories.defenders.push(player);
    } else if (["CDC", "CC", "ES", "ED"].includes(sigla)) {
      categories.midfielders.push(player);
    } else if (["COC", "ATT", "AT", "AS", "AD"].includes(sigla)) {
      categories.attackers.push(player);
    } else {
      // Fallback in base alla categoria dell'API
      if (player.category === "defender") categories.defenders.push(player);
      else if (player.category === "midfielder") categories.midfielders.push(player);
      else if (player.category === "forward") categories.attackers.push(player);
      else categories.midfielders.push(player);
    }
  });

  return categories;
};
