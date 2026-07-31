export interface ClubMember {
  name: string;
  proName?: string;
  role: string;
  overall: number;
  avatarColor: string;
  games: number;
  goals: number;
  assists: number;
  category: "forward" | "midfielder" | "defender" | "goalkeeper";
  passes: number;
  passPercent: number;
  tackles: number;
  tacklePercent: number;
  cleanSheets: number;
  winPercent: number;
  ratingAve: number;
  manOfTheMatch: number;
  weeklyStats?: {
    roleFidelity: number;
    tacticalMatch: boolean;
    compatibilityScore: number;
    passSuccessRate: number;
    tackleSuccessRate: number;
    shots: number;
    saves: number;
    passesMade?: number;
    passAttempts?: number;
    tacklesMade?: number;
    tackleAttempts?: number;
    motm?: number;
    games?: number;
    goals?: number;
    assists?: number;
    ratingAve?: number;
    rosterRole: string;
    rosterCategory: string;
    primaryPlayedRole: string;
  };
}

export interface MatchPlayer {
  name: string;
  role: "Forward" | "Midfielder" | "Defender" | "Goalkeeper";
  pos?: string | number;
  rating: number;
  goals: number;
  assists: number;
  shots: number;
  passesMade: number;
  passAttempts: number;
  tacklesMade: number;
  tackleAttempts: number;
  saves: number;
  redCards: number;
  motm: number;
}

export interface MatchTeamStats {
  shotsOnTarget: number;
  passes: number;
  tackles: number;
  saves: number;
  redCards: number;
}

export interface ClubMatch {
  opponent: string;
  opponentAbbreviation: string;
  opponentCrestId?: number | string;
  homeCrestId?: number | string;
  score: string;
  result: "W" | "D" | "L";
  date: string;
  type: string;
  isHome: boolean;
  day: string;
  month: string;
  mvp: string;
  matchStats: {
    home: MatchTeamStats;
    away: MatchTeamStats;
  };
  players: MatchPlayer[];
  oppPlayers: MatchPlayer[];
  timestamp?: number;
  timeAgoText?: string;
}

export interface PlayoffSeason {
  seasonNumber: number;
  result: string;
  badgeColor: string;
  division?: number;
}

export interface ClubData {
  name: string;
  region: string;
  skillRating: number;
  reputation: string;
  reputationTier: number;
  crestId?: number | string;
  customCrestId?: number | string;
  wins: number;
  draws: number;
  losses: number;
  totalMatches: number;
  leagueAppearances: number;
  playoffAppearances: number;
  goalsScored: number;
  goalsConceded: number;
  bestPlayoffDivision: number;
  bestPlayoffStatus: string;
  promotions: number;
  relegations: number;
  membersCount: {
    total: number;
    forwards: number;
    midfielders: number;
    defenders: number;
    goalkeepers: number;
  };
  featuredMember: ClubMember;
  membersList: ClubMember[];
  matches: ClubMatch[];
  playoffHistory: PlayoffSeason[];
}

export interface CrestProps {
  crestId: string | number;
  className?: string;
  alt?: string;
}
