/* RESPONSIVE: Mobile-first, fluid clamp(), auto-fit grid, card-transform tables */
import { useState } from "react";
import { ClubData, ClubMatch } from "../hooks/useClubData";
import { Shield, Trophy, Users, Award, ChevronRight, Activity, Calendar, Zap, Star, Radio } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { calculatePreviousWeekTOTW } from "../utils/totw";
import { getFormattedRoleCategoryWithSigla } from "../utils/roleUtils";
import { CrestImage } from "./Matches";
import PlayerCardModal from "./PlayerCardModal";
import { ClubMember } from "../types";

const getRoleTranslation = (role: string, lang: string): string => {
  if (!role) return "";
  if (lang === "it") return role;
  const roleMappings: Record<string, string> = {
    "Portiere (GK)": "Goalkeeper (GK)",
    "Difensore Centrale (CB)": "Center Back (CB)",
    "Terzino Sinistro (LB)": "Left Back (LB)",
    "Terzino Destro (RB)": "Right Back (RB)",
    "Centrocampista Centrale (CM)": "Central Midfielder (CM)",
    "Centrocampista Difensivo (CDM)": "Central Defensive Midfielder (CDM)",
    "Centrocampista Offensivo (CAM)": "Central Offensive Midfielder (CAM)",
    "Esterno Sinistro (LM)": "Left Midfielder (LM)",
    "Esterno Destro (RM)": "Right Midfielder (RM)",
    "Attaccante Centrale (ST)": "Center Forward (ST)",
    "Ala Sinistra (LW)": "Left Winger (LW)",
    "Ala Destra (RW)": "Right Winger (RW)"
  };
  return roleMappings[role] || role;
};

interface ClubCrestProps {
  crestId?: number | string;
  clubName: string;
  abbreviation: string;
  isHome?: boolean;
}

function ClubCrest({ crestId, clubName, abbreviation, isHome }: ClubCrestProps) {
  return (
    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
      <CrestImage crestId={crestId || ""} className="w-full h-full object-contain select-none drop-shadow-sm" alt={clubName} />
    </div>
  );
}

interface OverviewProps {
  clubData: ClubData;
  onTabChange?: (tab: string) => void;
}

export default function Overview({ clubData, onTabChange }: OverviewProps) {
  const { language, t } = useLanguage();
  const [isTrophyRoomExpanded, setIsTrophyRoomExpanded] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);

  const totalMembers = clubData.membersList?.length || 25;

  const attackersCount = clubData.membersList ? clubData.membersList.filter(m => 
    m.category === "forward" || 
    ["ST", "LW", "RW", "CF", "ATT", "Attaccante", "Ala"].some(r => (m.role || "").includes(r))
  ).length : 8;

  const midfieldersCount = clubData.membersList ? clubData.membersList.filter(m => 
    m.category === "midfielder" || 
    ["CM", "CDM", "CAM", "LM", "RM", "CC", "CDC", "COC", "ES", "ED", "Centrocampista"].some(r => (m.role || "").includes(r))
  ).length : 7;

  const defendersCount = clubData.membersList ? clubData.membersList.filter(m => 
    m.category === "defender" || 
    ["CB", "LB", "RB", "LWB", "RWB", "DC", "TS", "TD", "Difensore", "Terzino"].some(r => (m.role || "").includes(r))
  ).length : 8;

  const goalkeepersCount = clubData.membersList ? clubData.membersList.filter(m => 
    m.category === "goalkeeper" || 
    ["GK", "POR", "Portiere"].some(r => (m.role || "").includes(r))
  ).length : 2;

  // Roster highlights & percentage calculations
  const attackersPercent = totalMembers > 0 ? (attackersCount / totalMembers) * 100 : 0;
  const midfieldersPercent = totalMembers > 0 ? (midfieldersCount / totalMembers) * 100 : 0;
  const defendersPercent = totalMembers > 0 ? (defendersCount / totalMembers) * 100 : 0;
  const goalkeepersPercent = totalMembers > 0 ? (goalkeepersCount / totalMembers) * 100 : 0;

  const avgOverall = clubData.membersList && clubData.membersList.length > 0 
    ? Math.round(clubData.membersList.reduce((acc, m) => acc + (m.overall || 0), 0) / clubData.membersList.length) 
    : 85;

  const rosterTopScorer = clubData.membersList && clubData.membersList.length > 0
    ? [...clubData.membersList].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0]
    : null;

  const rosterTopAssister = clubData.membersList && clubData.membersList.length > 0
    ? [...clubData.membersList].sort((a, b) => (b.assists || 0) - (a.assists || 0))[0]
    : null;

  // Calculations for history bar segment widths
  const total = clubData.wins + clubData.draws + clubData.losses;
  const winPercent = total > 0 ? parseFloat(((clubData.wins / total) * 100).toFixed(2)) : 0;
  const drawPercent = total > 0 ? parseFloat(((clubData.draws / total) * 100).toFixed(2)) : 0;
  const lossPercent = total > 0 ? parseFloat(((clubData.losses / total) * 100).toFixed(2)) : 0;

  // Dynamic SVG donut parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const winStrokeLength = (winPercent / 100) * circumference;
  const drawStrokeLength = (drawPercent / 100) * circumference;
  const lossStrokeLength = (lossPercent / 100) * circumference;

  const winOffset = 0;
  const drawOffset = -winStrokeLength;
  const lossOffset = -(winStrokeLength + drawStrokeLength);

  let dominantColorHex = "#0dd08b";
  let glowColorClass = "hover:shadow-[0_0_30px_rgba(13,208,139,0.3)] hover:border-[#0dd08b]/80";
  let topBarColorClass = "from-transparent via-[#0dd08b] to-transparent";

  if (winPercent >= drawPercent && winPercent >= lossPercent) {
    dominantColorHex = "#0dd08b";
    glowColorClass = "hover:shadow-[0_0_30px_rgba(13,208,139,0.3)] hover:border-[#0dd08b]/80";
    topBarColorClass = "from-transparent via-[#0dd08b] to-transparent";
  } else if (drawPercent >= winPercent && drawPercent >= lossPercent) {
    dominantColorHex = "#f4f4f5";
    glowColorClass = "hover:shadow-[0_0_30px_rgba(244,244,245,0.3)] hover:border-white/80";
    topBarColorClass = "from-transparent via-white to-transparent";
  } else {
    dominantColorHex = "#be213b";
    glowColorClass = "hover:shadow-[0_0_30px_rgba(190,33,59,0.3)] hover:border-[#be213b]/80";
    topBarColorClass = "from-transparent via-[#be213b] to-transparent";
  }

  // Framer Motion variants for bento grids
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  };

  // Get the latest match
  const latestMatch: ClubMatch = clubData.matches[0] || {
    opponent: "Elite Madrid FC",
    score: "4 - 0",
    result: "W" as const,
    date: "Ieri, 22:30",
    type: "League Match" as const,
    isHome: true,
    mvp: "Skifo89",
    matchStats: {
      home: { shotsOnTarget: 8, passes: 120, tackles: 15, saves: 2, redCards: 0 },
      away: { shotsOnTarget: 3, passes: 85, tackles: 10, saves: 4, redCards: 0 }
    },
    players: [],
    oppPlayers: [],
    opponentAbbreviation: "ELI",
    day: "08",
    month: "LUG",
    homeCrestId: undefined,
    opponentCrestId: undefined
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
      {/* SECTION TITLE */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <h2 className="font-serif text-3xl sm:text-4xl text-white font-black tracking-widest uppercase flex flex-col">
          <span className="text-white/40 text-xs font-sans font-bold tracking-[0.2em] mb-1">{t("overview.sectionTitle")}</span>
          {t("overview.sectionSubtitle")}
        </h2>
        <div className="hidden md:block h-[1px] bg-gradient-to-r from-white/20 to-transparent flex-grow ml-12"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="flex flex-col gap-8 w-full"
        id="bento-overview-grid"
      >
        {/* ========================================================= */}
        {/* MACRO-SEZIONE 1: Analisi del Club (In alto) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Colonna 1: DATI GENERALI CARD */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#14100c]/80 to-[#0a0a0a]/95 backdrop-blur-xl border border-[#d7ae6a]/12 hover:border-gold/80 hover:shadow-[0_0_30px_rgba(215,174,106,0.3)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden group w-full h-full"
            id="box-dati-generali"
          >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-[radial-gradient(circle_at_top,rgba(215,174,106,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-48 h-48 bg-gold/2 blur-[60px] pointer-events-none rounded-full" />
            
            {/* Top tech accent bar */}
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent pointer-events-none" />

            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold/50 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold"></span>
                  </span>
                  <h3 className="text-gold text-base md:text-lg font-serif font-black uppercase tracking-widest">
                    {t("overview.generalData")}
                  </h3>
                </div>
                <span className="text-[10px] font-sans text-white/40 uppercase tracking-widest">
                  SYS // CLUB_01
                </span>
              </div>

              {/* List of Stats separated by lines */}
              <div className="flex flex-col w-full font-sans">
                {/* 1. Record Complessivo Totale (Campionato + Playoff) */}
                <div className="flex justify-between items-center py-3 border-b border-white/10 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Record complessivo' : 'Total Record'}
                  </span>
                  <span className="text-base sm:text-lg font-serif font-black text-white text-right drop-shadow-sm">
                    {clubData.wins} - {clubData.draws} - {clubData.losses}
                  </span>
                </div>

                {/* 2. Partite Giocate Totali */}
                <div className="flex justify-between items-center py-3 border-b border-white/5 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Partite totali giocate' : 'Matches Played'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-bold text-white text-right">
                    {clubData.totalMatches}
                  </span>
                </div>

                {/* 3. Dettaglio: Campionato */}
                <div className="flex justify-between items-center py-3 border-b border-white/5 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] pl-2 border-l-2 border-[#3b82f6]">
                    {language === 'it' ? 'Presenze in campionato' : 'in League'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-bold text-white text-right">
                    {clubData.leagueAppearances}
                  </span>
                </div>

                {/* 4. Dettaglio: Playoff */}
                <div className="flex justify-between items-center py-3 border-b border-white/10 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] pl-2 border-l-2 border-[#d7ae6a]">
                    {language === 'it' ? 'Partecipazioni ai playoff' : 'in Playoffs'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-bold text-white text-right">
                    {clubData.playoffAppearances}
                  </span>
                </div>

                {/* 5. Gol Fatti */}
                <div className="flex justify-between items-center py-3 border-b border-white/5 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Gol totali segnati' : 'Goals Scored'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-black text-[#d7ae6a] text-right drop-shadow-[0_0_8px_rgba(215,174,106,0.3)]">
                    {clubData.goalsScored}
                  </span>
                </div>

                {/* 6. Gol Subiti */}
                <div className="flex justify-between items-center py-3 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Gol totali subiti' : 'Goals Conceded'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-bold text-white text-right">
                    {clubData.goalsConceded}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Colonna 2: TASSO VITTORIE CARD */}
          <motion.div
            variants={itemVariants}
            className={`rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#14100c]/80 to-[#0a0a0a]/95 backdrop-blur-xl border border-[#d7ae6a]/12 ${glowColorClass} transition-all duration-500 flex flex-col justify-between relative overflow-hidden group w-full h-full`}
            id="box-ratio-donut"
          >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-[radial-gradient(circle_at_top,rgba(215,174,106,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
            <div className="absolute top-0 right-0 w-36 h-36 bg-gold/2 blur-[60px] pointer-events-none rounded-full" />
            
            {/* Top tech accent bar */}
            <div className={`absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r ${topBarColorClass} pointer-events-none`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: dominantColorHex }}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5`} style={{ backgroundColor: dominantColorHex }}></span>
                </span>
                <h3 className="text-gold text-base md:text-lg font-serif font-black uppercase tracking-widest">
                  {t("overview.winRatio")}
                </h3>
              </div>
              <span className="text-[10px] font-sans text-white/40 uppercase tracking-widest">
                ANALYSIS // 02
              </span>
            </div>

            {/* Center: Circular Donut Chart */}
            <div className="flex flex-col items-center justify-center flex-1 my-1">
              {/* Contenitore principale del grafico, centrato e con dimensioni fisse */}
              <div className="relative flex justify-center items-center w-32 h-32 mx-auto my-6" id="donut-chart-container">
                
                {/* 1. Qui dentro ci va il tuo codice per disegnare il cerchio colorato (SVG o CSS) */}
                <div className="absolute inset-0 w-full h-full">
                  {/* SVG Donut */}
                  <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 110 110">
                    {/* Background trace ring */}
                    <circle
                      cx="55"
                      cy="55"
                      r="45"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.02)"
                      strokeWidth="7"
                    />
                    
                    {/* Losses Segment (Red) */}
                    <motion.circle
                      cx="55"
                      cy="55"
                      r="45"
                      fill="transparent"
                      stroke="#be213b"
                      strokeWidth="7"
                      strokeDasharray={`${lossStrokeLength} ${circumference}`}
                      initial={{ strokeDashoffset: circumference + lossOffset }}
                      whileInView={{ strokeDashoffset: lossOffset }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                    />

                    {/* Draws Segment (White) */}
                    <motion.circle
                      cx="55"
                      cy="55"
                      r="45"
                      fill="transparent"
                      stroke="#f4f4f5"
                      strokeWidth="7"
                      strokeDasharray={`${drawStrokeLength} ${circumference}`}
                      initial={{ strokeDashoffset: circumference + drawOffset }}
                      whileInView={{ strokeDashoffset: drawOffset }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
                    />

                    {/* Wins Segment (Green) */}
                    <motion.circle
                      cx="55"
                      cy="55"
                      r="45"
                      fill="transparent"
                      stroke="#0dd08b"
                      strokeWidth="7"
                      strokeDasharray={`${winStrokeLength} ${circumference}`}
                      initial={{ strokeDashoffset: circumference + winOffset }}
                      whileInView={{ strokeDashoffset: winOffset }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: "easeOut" }}
                    />
                  </svg>
                </div>

                {/* 2. L'immagine dello stemma: centrata assolutamente SOPRA il grafico */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-16 h-16 flex items-center justify-center p-1">
                    <img 
                      src="https://res.cloudinary.com/kwwyxgal/image/upload/v1785138160/Progetto_senza_titolo_-_2026-07-27T094228.277_yychku.png" 
                      alt="Club Crest" 
                      className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(215,174,106,0.35)]"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200";
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legend below: W, D, L in a sleek row with elegant dividers */}
            <div className="flex justify-between items-center w-full px-4 pt-4 border-t border-white/5">
              {/* Box VITTORIE */}
              <div className="flex flex-col items-center w-1/3 border-r border-white/5">
                <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0dd08b]"></span> {t("overview.win").charAt(0)}
                </div>
                <div className="text-2xl font-black text-[#0dd08b] font-serif leading-none">{clubData.wins}</div>
                <div className="text-xs text-gray-500 mt-1 font-serif font-bold leading-none">{Math.round(winPercent)}%</div>
              </div>

              {/* Box PAREGGI */}
              <div className="flex flex-col items-center w-1/3 border-r border-white/5">
                <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {t("overview.draw") === "Pareggio" ? "N" : "D"}
                </div>
                <div className="text-2xl font-black text-white font-serif leading-none">{clubData.draws}</div>
                <div className="text-xs text-gray-500 mt-1 font-serif font-bold leading-none">{Math.round(drawPercent)}%</div>
              </div>

              {/* Box SCONFITTE */}
              <div className="flex flex-col items-center w-1/3">
                <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#be213b]"></span> {t("overview.loss") === "Sconfitta" ? "P" : "L"}
                </div>
                <div className="text-2xl font-black text-[#be213b] font-serif leading-none">{clubData.losses}</div>
                <div className="text-xs text-gray-500 mt-1 font-serif font-bold leading-none">{Math.round(lossPercent)}%</div>
              </div>
            </div>
          </motion.div>

          {/* Colonna 3: TEST MATCH (AMICHEVOLI) CARD */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#14100c]/80 to-[#0a0a0a]/95 backdrop-blur-xl border border-[#d7ae6a]/12 hover:border-[#0dd08b]/80 hover:shadow-[0_0_30px_rgba(13,208,139,0.3)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden group w-full h-full"
            id="box-test-match-amichevoli"
          >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-[radial-gradient(circle_at_top,rgba(215,174,106,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-48 h-48 bg-[#0dd08b]/2 blur-[60px] pointer-events-none rounded-full" />
            
            {/* Top tech accent bar */}
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#0dd08b] to-transparent pointer-events-none" />

            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0dd08b]/50 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0dd08b]"></span>
                  </span>
                  <h3 className="text-[#0dd08b] text-base md:text-lg font-serif font-black uppercase tracking-widest">
                    {language === 'it' ? 'Amichevoli' : 'Friendlies'}
                  </h3>
                </div>
                <span className="text-[10px] font-sans text-white/40 uppercase tracking-widest">
                  Test Match
                </span>
              </div>

              {/* List of Stats separated by lines */}
              <div className="flex flex-col w-full font-sans">
                {/* 1. Record */}
                <div className="flex justify-between items-center py-3 border-b border-white/10 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Record complessivo' : 'Record'}
                  </span>
                  <span className="text-base sm:text-lg font-serif font-black text-white text-right drop-shadow-sm">
                    23 - 5 - 8
                  </span>
                </div>

                {/* 2. Partite Giocate */}
                <div className="flex justify-between items-center py-3 border-b border-white/5 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Partite totali giocate' : 'Matches Played'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-bold text-white text-right">
                    36
                  </span>
                </div>

                {/* 3. Win Rate */}
                <div className="flex justify-between items-center py-3 border-b border-white/5 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a] pl-2 border-l-2 border-[#0dd08b]">
                    Win Rate
                  </span>
                  <span className="text-sm sm:text-base font-serif font-black text-[#0dd08b] text-right drop-shadow-[0_0_8px_rgba(13,208,139,0.3)]">
                    65%
                  </span>
                </div>

                {/* 4. Gol Fatti */}
                <div className="flex justify-between items-center py-3 border-b border-white/10 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Gol totali segnati' : 'Goals Scored'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-black text-[#0dd08b] text-right drop-shadow-[0_0_8px_rgba(13,208,139,0.3)]">
                    82
                  </span>
                </div>

                {/* 5. Gol Subiti */}
                <div className="flex justify-between items-center py-3 w-full">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.2em] font-semibold text-[#a89b8a]">
                    {language === 'it' ? 'Gol totali subiti' : 'Goals Conceded'}
                  </span>
                  <span className="text-sm sm:text-base font-serif font-bold text-gray-400 text-right">
                    41
                  </span>
                </div>
              </div>
            </div>

            {/* Base Card Test Match (Esattamente come la card centrale) */}
            <div className="flex justify-between items-center w-full px-2 mt-auto pt-6 border-t border-white/5">
              {/* Box VITTORIE */}
              <div className="flex flex-col items-center w-1/3 border-r border-white/5">
                <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0dd08b]"></span> {t("overview.win").charAt(0)}
                </div>
                <div className="text-2xl font-black text-[#0dd08b] font-serif leading-none">23</div>
                <div className="text-xs text-gray-500 mt-1 font-serif font-bold leading-none">63%</div>
              </div>

              {/* Box PAREGGI */}
              <div className="flex flex-col items-center w-1/3 border-r border-white/5">
                <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {t("overview.draw") === "Pareggio" ? "N" : "D"}
                </div>
                <div className="text-2xl font-black text-white font-serif leading-none">5</div>
                <div className="text-xs text-gray-500 mt-1 font-serif font-bold leading-none">14%</div>
              </div>

              {/* Box SCONFITTE */}
              <div className="flex flex-col items-center w-1/3">
                <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#be213b]"></span> {t("overview.loss") === "Sconfitta" ? "P" : "L"}
                </div>
                <div className="text-2xl font-black text-[#be213b] font-serif leading-none">8</div>
                <div className="text-xs text-gray-500 mt-1 font-serif font-bold leading-none">22%</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* MACRO-SEZIONE 2: Vetrina Giocatori (In basso) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Colonna 1: MVP DEL CLUB CARD */}
          <motion.div
            variants={itemVariants}
            onClick={() => clubData.featuredMember && setSelectedMember(clubData.featuredMember)}
            className="flex flex-col h-full bg-gradient-to-br from-[#1a150d]/90 via-[#0a0805]/95 to-[#1a150d]/95 backdrop-blur-xl border border-[#d7ae6a]/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(215,174,106,0.2)] relative overflow-hidden group hover:border-[#d7ae6a]/90 hover:shadow-[0_0_60px_rgba(215,174,106,0.4)] transition-all duration-700 cursor-pointer"
            id="box-featured-player"
          >
            {/* Effetto luce dall'alto e riflesso animato */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d7ae6a] to-transparent opacity-80"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[#d7ae6a]/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_ease-in-out_infinite] pointer-events-none" />
            
             {/* Header (Rimane uguale) */}
             <div className="flex justify-between items-center pb-4 border-b border-[#d7ae6a]/20 mb-6 relative z-10">
               <div className="flex items-center gap-2">
                 <span className="text-[#d7ae6a] drop-shadow-md">★</span>
                 <h3 className="text-base md:text-lg font-serif font-black uppercase tracking-widest text-[#d7ae6a] m-0">
                   {language === 'it' ? 'MVP del Club' : 'Club MVP'}
                 </h3>
               </div>
               <span className="text-[10px] text-[#a89b8a] uppercase tracking-[0.3em]">Top Star</span>
             </div>

             {clubData.featuredMember ? (
               <div className="flex flex-col h-full justify-between gap-6 relative z-10">
                 {/* Avatar (Ancora più luminoso) */}
                 <div className="flex flex-col items-center justify-center">
                   <div className="relative w-32 h-32 mb-6">
                     {/* Glow animato dietro l'avatar */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-[#d7ae6a]/40 to-[#f3db9d]/30 blur-2xl rounded-full group-hover:bg-[#d7ae6a]/70 group-hover:blur-3xl transition-all duration-700"></div>
                     <img 
                       src="https://res.cloudinary.com/kwwyxgal/image/upload/v1783609952/ChatGPT_Image_9_lug_2026_17_11_29_qc4my9.png" 
                       className="relative z-10 w-full h-full rounded-full border-[3px] border-[#d7ae6a] object-cover shadow-[0_10px_30px_rgba(0,0,0,0.8)] ring-4 ring-[#d7ae6a]/20 group-hover:ring-[#d7ae6a]/40 transition-all duration-500" 
                       referrerPolicy="no-referrer"
                     />
                     <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-[#2a2215] to-black border-[3px] border-[#d7ae6a] text-[#f3db9d] font-serif font-black text-lg w-12 h-12 flex items-center justify-center rounded-full z-20 shadow-[0_0_20px_rgba(215,174,106,0.5)] transform group-hover:scale-110 transition-transform duration-500">
                       {clubData.featuredMember.overall}
                     </div>
                   </div>
                   
                   <span className="text-[10px] text-[#a89b8a] uppercase tracking-[0.2em] font-bold mb-2">
                       {getFormattedRoleCategoryWithSigla(clubData.featuredMember.role, clubData.featuredMember.category, language)}
                   </span>
                   
                   {/* Nome Giocatore (Adattamento automatico della grandezza su una riga) */}
                   <div className="w-full px-2 flex justify-center" style={{ containerType: 'inline-size' }}>
                     <h2 
                       className="font-serif font-black text-white uppercase text-center whitespace-nowrap leading-tight drop-shadow-md"
                       style={{ 
                         fontSize: `clamp(10px, 100cqw / ${Math.max(10, clubData.featuredMember?.name?.length || 10) * 0.55}, 28px)`,
                         letterSpacing: (clubData.featuredMember?.name?.length || 0) > 12 ? '0.02em' : '0.05em'
                       }}
                     >
                       {clubData.featuredMember.name}
                     </h2>
                   </div>
                 </div>

                 {/* Griglia Stats (Lusso) */}
                 <div className="grid grid-cols-3 gap-[1px] bg-[#d7ae6a]/20 rounded-xl overflow-hidden border border-[#d7ae6a]/30 mt-auto shadow-[0_0_15px_rgba(215,174,106,0.1)]">
                   {/* Box GOL (Testo verde brillante) */}
                   <div className="bg-gradient-to-b from-[#1a150d] to-black p-4 flex flex-col items-center justify-center group-hover:from-[#2a2215] transition-colors duration-500">
                     <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a89b8a] mb-1">
                       {language === 'it' ? 'Gol' : 'Goals'}
                     </span>
                     <span className="text-2xl font-serif font-black text-[#0dd08b] drop-shadow-[0_0_8px_rgba(13,208,139,0.5)]">{clubData.featuredMember.goals}</span>
                   </div>
                   {/* Box ASSIST */}
                   <div className="bg-gradient-to-b from-[#1a150d] to-black p-4 flex flex-col items-center justify-center group-hover:from-[#2a2215] transition-colors duration-500">
                     <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a89b8a] mb-1">
                       {language === 'it' ? 'Assist' : 'Assists'}
                     </span>
                     <span className="text-2xl font-serif font-black text-white">{clubData.featuredMember.assists}</span>
                   </div>
                   <div className="bg-gradient-to-b from-[#1a150d] to-black p-4 flex flex-col items-center justify-center group-hover:from-[#2a2215] transition-colors duration-500">
                     <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a89b8a] mb-1">
                       {language === 'it' ? 'Presenze' : 'Appearances'}
                     </span>
                     <span className="text-2xl font-serif font-black text-white">{clubData.featuredMember.games}</span>
                   </div>
                   <div className="bg-gradient-to-b from-[#1a150d] to-black p-4 flex flex-col items-center justify-center group-hover:from-[#2a2215] transition-colors duration-500">
                     <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a89b8a] mb-1">
                       {language === 'it' ? 'Media Voto' : 'Avg Rating'}
                     </span>
                     <span className="text-2xl font-serif font-black text-gold">{clubData.featuredMember.ratingAve.toFixed(1)}</span>
                   </div>
                   <div className="bg-gradient-to-b from-[#1a150d] to-black p-4 flex flex-col items-center justify-center group-hover:from-[#2a2215] transition-colors duration-500">
                     <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a89b8a] mb-1">MVP</span>
                     <span className="text-2xl font-serif font-black text-white">{clubData.featuredMember.manOfTheMatch}</span>
                   </div>
                   <div className="bg-gradient-to-b from-[#1a150d] to-black p-4 flex flex-col items-center justify-center group-hover:from-[#2a2215] transition-colors duration-500">
                     <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#a89b8a] mb-1">
                       {language === 'it' ? 'Valutazione' : 'Rating'}
                     </span>
                     <span className="text-2xl font-serif font-black text-white">{clubData.featuredMember.overall}</span>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col justify-center items-center py-12 text-white/30 text-sm font-sans w-full flex-1" id="featured-member-empty">
                 {language === 'it' ? "Nessun giocatore in evidenza" : "No featured player"}
               </div>
             )}
          </motion.div>

          {/* Colonna 2: TEAM OF THE WEEK CARD */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col h-full bg-gradient-to-br from-[#14100c]/80 to-[#0a0a0a]/95 backdrop-blur-xl border border-[#d7ae6a]/12 rounded-2xl p-4 sm:p-6 shadow-xl hover:border-[#d7ae6a]/80 hover:shadow-[0_0_30px_rgba(215,174,106,0.3)] transition-all duration-500"
            id="box-top-players"
          >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-[radial-gradient(circle_at_top,rgba(215,174,106,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#d7ae6a]/30 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-[#d7ae6a]"></div>
                <h3 className="text-base md:text-lg font-serif font-black uppercase tracking-widest text-[#d7ae6a] m-0">Team of the Week</h3>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">I Migliori</span>
            </div>

            {/* Top 5 Weekly Players List */}
            <div className="flex flex-col gap-2 h-full">
              {(() => {
                const dynamicList = calculatePreviousWeekTOTW(
                  clubData.matches || [], 
                  clubData.membersList || [], 
                  clubData.featuredMember?.name,
                  language
                );
                
                if (dynamicList.length === 0) {
                  return (
                    <div className="flex-1 flex items-center justify-center py-12 text-center">
                      <span className="text-[#a89b8a] text-xs font-sans tracking-widest uppercase">
                        {language === 'it' ? 'Nessun match disputato la scorsa settimana' : 'No matches played last week'}
                      </span>
                    </div>
                  );
                }
                
                return dynamicList.map((player, idx) => {
                  const dotColor = player.dotColor || "bg-[#22c55e]";
                  const awardLabel = player.awardLabel || "Top Player";
                  const subRoleLabel = player.subRoleLabel || "Centrocampista (CM)";
                  const mainRoleLabel = player.mainRoleLabel;
                  const siglaLabel = player.siglaLabel;
                  const weeklyStat = player.weeklyStat || player.stats || "";
                  const weeklyRating = player.weeklyRating || player.rating || 6.0;

                  // Explicit map for Tailwind compiler to detect text colors
                  const textColorMap: Record<string, string> = {
                    "bg-[#d7ae6a]": "text-[#d7ae6a]",
                    "bg-[#3b82f6]": "text-[#3b82f6]",
                    "bg-[#22c55e]": "text-[#22c55e]",
                    "bg-[#be213b]": "text-[#be213b]",
                    "bg-[#94a3b8]": "text-[#94a3b8]",
                    "bg-gold": "text-[#d7ae6a]", // Fallback gold
                  };
                  const textColor = textColorMap[dotColor] || "text-gray-300";

                  const baseMember = (clubData.membersList || []).find(
                    m => m.name.toLowerCase() === player.name.toLowerCase() ||
                         (m.proName && m.proName.toLowerCase() === player.name.toLowerCase())
                  );

                  const enrichedWeeklyStats = player.weeklyStats ? {
                    ...player.weeklyStats,
                    games: player.gamesPlayed || (player.weeklyStats as any)?.games || 0,
                    goals: (player.weeklyStats as any)?.goals ?? 0,
                    assists: (player.weeklyStats as any)?.assists ?? 0,
                    ratingAve: player.weeklyRating || 7.0
                  } : undefined;

                  const matchingMember = baseMember ? {
                    ...baseMember,
                    weeklyStats: enrichedWeeklyStats || baseMember.weeklyStats
                  } : {
                    name: player.name,
                    proName: player.name,
                    role: player.mainRoleLabel || player.subRoleLabel || "CC",
                    overall: 85,
                    avatarColor: "from-amber-600 to-amber-900",
                    games: player.gamesPlayed || 0,
                    goals: 0,
                    assists: 0,
                    category: (player.category as any) || "midfielder",
                    passes: 0,
                    passPercent: player.weeklyStats?.passSuccessRate || 80,
                    tackles: 0,
                    tacklePercent: player.weeklyStats?.tackleSuccessRate || 65,
                    cleanSheets: 0,
                    winPercent: 75,
                    ratingAve: player.weeklyRating || 7.5,
                    manOfTheMatch: player.weeklyStats?.motm || 0,
                    weeklyStats: enrichedWeeklyStats
                  };

                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedMember(matchingMember)}
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-xl border transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] ${
                      player.isMVP 
                        ? 'bg-gradient-to-r from-[#d7ae6a]/20 to-transparent border-[#d7ae6a]/50 shadow-[0_0_20px_rgba(215,174,106,0.15)]' 
                        : 'bg-gradient-to-r from-white/5 to-transparent border-white/5 hover:border-[#d7ae6a]/50 hover:shadow-[0_0_15px_rgba(215,174,106,0.1)]'
                    }`}>
                      
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-1 sm:pr-2">
                        {/* Linea laterale colorata per il ruolo */}
                        <div className={`w-1 h-8 rounded-full ${dotColor} shrink-0`} style={{
                          boxShadow: dotColor.includes('22c55e') ? '0 0 8px rgba(34, 197, 94, 0.5)' : 
                                       dotColor.includes('3b82f6') ? '0 0 8px rgba(59, 130, 246, 0.5)' : 
                                       dotColor.includes('be213b') ? '0 0 8px rgba(190, 33, 59, 0.5)' : 
                                       dotColor.includes('94a3b8') ? '0 0 8px rgba(148, 163, 184, 0.5)' :
                                      '0 0 8px rgba(215, 174, 106, 0.5)'
                        }}></div>
                        
                        <div className="flex flex-col min-w-0">
                          {/* Etichetta Premio d'impatto */}
                          <span className={`text-[8px] sm:text-[10px] font-sans uppercase tracking-wider sm:tracking-[0.2em] font-black mb-0.5 truncate ${textColor}`}>
                            {awardLabel}
                          </span>
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-serif font-bold uppercase truncate transition-colors leading-tight ${
                              player.isMVP ? 'text-[#d7ae6a] text-sm xs:text-base sm:text-lg' : 'text-white text-xs xs:text-sm sm:text-base group-hover:text-[#d7ae6a]'
                            }`}>
                              {player.name}
                            </span>
                            {(player.isStarDelClub || (clubData.featuredMember?.name && player.name.toLowerCase() === clubData.featuredMember.name.toLowerCase())) && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0" title="Star del Club">
                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                <span>STAR</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5 min-w-0">
                            <span className="text-[8px] sm:text-[10px] text-[#a89b8a] uppercase tracking-widest truncate block">
                              {mainRoleLabel || subRoleLabel}
                            </span>
                            
                            {player.weeklyStats && (
                              <>
                                <span className="text-gray-600 text-[8px]">•</span>
                                <span className="text-[8px] text-[#a89b8a] uppercase tracking-wider font-medium" title={language === 'it' ? `Fedeltà al ruolo: ${player.weeklyStats.roleFidelity}%` : `Role fidelity: ${player.weeklyStats.roleFidelity}%`}>
                                  {player.weeklyStats.roleFidelity >= 100 
                                    ? (language === 'it' ? 'Specialista' : 'Specialist') 
                                    : (language === 'it' ? `Versatile` : `Versatile`)
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0">
                        {/* Badge Punteggio Pro */}
                        {player.weeklyStats?.compatibilityScore !== undefined && (
                          <div className="flex flex-col items-center justify-center bg-[#d7ae6a]/10 border border-[#d7ae6a]/35 rounded-lg px-1.5 sm:px-2.5 h-8 sm:h-10 min-w-[44px] sm:min-w-[52px] group-hover:border-[#d7ae6a]/60 transition-colors">
                            <span className="text-[6px] sm:text-[8px] font-sans text-[#d7ae6a] font-black uppercase tracking-wider leading-none">
                              PRO
                            </span>
                            <span className="text-xs sm:text-sm font-mono font-black text-white leading-none mt-0.5 sm:mt-1">
                              {player.weeklyStats.compatibilityScore}
                            </span>
                          </div>
                        )}
                        
                        {/* Badge Voto EA */}
                        <div className="bg-black/60 border border-white/10 rounded-lg px-1.5 sm:px-2.5 h-8 sm:h-10 flex flex-col items-center justify-center min-w-[38px] sm:min-w-[46px] shrink-0 group-hover:border-[#d7ae6a]/50 transition-colors">
                          <span className="text-[6px] sm:text-[8px] font-sans text-gray-400 font-bold uppercase tracking-widest leading-none">
                            VOTO
                          </span>
                          <span className="text-xs sm:text-sm font-serif font-black text-[#d7ae6a] leading-none mt-0.5 sm:mt-1">
                            {weeklyRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Pulsante Classifica Completa */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  if (onTabChange) onTabChange('members');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('set-members-view', { detail: 'ranking' }));
                  }, 100);
                }}
                className="px-6 py-2 bg-black/60 border border-[#d7ae6a]/30 rounded-lg text-[#d7ae6a] font-serif uppercase tracking-widest text-xs hover:bg-black hover:border-[#d7ae6a]/80 transition-all shadow-[0_0_15px_rgba(215,174,106,0.1)] hover:shadow-[0_0_20px_rgba(215,174,106,0.3)]"
              >
                {language === 'it' ? 'Classifica Completa' : 'Full Ranking'}
              </button>
            </div>
          </motion.div>

          {/* Colonna 3: ROSTER SQUADRA CARD */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl p-4 sm:p-5 bg-black/20 bg-gradient-to-br from-white/[0.08] via-black/40 to-black/60 backdrop-blur-md border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-[#d7ae6a]/40 hover:shadow-[0_0_35px_rgba(215,174,106,0.2)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden group w-full h-full"
            id="box-roster-squadra"
          >
            <div className="absolute inset-x-0 top-0 h-[40%] bg-[radial-gradient(circle_at_top,rgba(215,174,106,0.12)_0%,transparent_70%)] pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-48 h-48 bg-gold/2 blur-[60px] pointer-events-none rounded-full" />
            
            {/* Top tech accent bar */}
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#d7ae6a] to-transparent pointer-events-none" />

            <div className="flex flex-col h-full z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[#d7ae6a] font-serif font-black text-lg">•</span>
                  <h3 className="text-[#d7ae6a] text-base md:text-lg font-serif font-black uppercase tracking-widest">
                    {language === 'it' ? 'Roster Squadra' : 'Squad Roster'}
                  </h3>
                </div>
                <span className="text-[10px] font-sans text-white/40 uppercase tracking-widest">
                  ROSTER
                </span>
              </div>

              {/* Club Logo + Total Members Banner */}
              <div className="flex items-center justify-between py-3 border-b border-white/10 w-full">
                <div className="flex items-center gap-3">
                  <img
                    src="https://res.cloudinary.com/kwwyxgal/image/upload/v1785138160/Progetto_senza_titolo_-_2026-07-27T094228.277_yychku.png"
                    alt={`${clubData.name} Logo`}
                    className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(215,174,106,0.4)]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#8a7d63]">
                      FC {clubData.name.toUpperCase()}
                    </span>
                    <span className="block text-xs sm:text-sm font-sans uppercase tracking-[0.15em] font-black text-white">
                      {language === 'it' ? 'Membri Totali' : 'Total Members'}
                    </span>
                  </div>
                </div>
                <span className="text-3xl sm:text-4xl font-serif font-black text-white drop-shadow-sm">
                  {totalMembers}
                </span>
              </div>

              {/* Stacked distribution bar */}
              <div className="my-4">
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5">
                  <div className="h-full bg-[#be213b] shadow-[0_0_8px_rgba(190,33,59,0.4)]" style={{ width: `${attackersPercent}%` }} title={`Attaccanti: ${attackersCount}`} />
                  <div className="h-full bg-[#0dd08b] shadow-[0_0_8px_rgba(13,208,139,0.4)]" style={{ width: `${midfieldersPercent}%` }} title={`Centrocampisti: ${midfieldersCount}`} />
                  <div className="h-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{ width: `${defendersPercent}%` }} title={`Difensori: ${defendersCount}`} />
                  <div className="h-full bg-[#d7ae6a] shadow-[0_0_8px_rgba(215,174,106,0.4)]" style={{ width: `${goalkeepersPercent}%` }} title={`Portieri: ${goalkeepersCount}`} />
                </div>
              </div>

              {/* Breakdown by role */}
              <div className="flex flex-col gap-3 w-full font-sans mb-5 relative z-10">
                {/* Attaccanti */}
                <div className="flex flex-col gap-1 w-full pb-1 border-b border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#be213b] shrink-0 shadow-[0_0_6px_rgba(190,33,59,0.6)]"></span>
                      <span className="font-sans uppercase tracking-[0.12em] font-medium text-white/90">
                        {language === 'it' ? 'Attaccanti' : 'Forwards'}
                      </span>
                    </div>
                    <span className="text-sm font-serif font-bold text-white font-mono">
                      {attackersCount}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#be213b]" style={{ width: `${attackersPercent}%` }} />
                  </div>
                </div>

                {/* Centrocampisti */}
                <div className="flex flex-col gap-1 w-full pb-1 border-b border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0dd08b] shrink-0 shadow-[0_0_6px_rgba(13,208,139,0.6)]"></span>
                      <span className="font-sans uppercase tracking-[0.12em] font-medium text-white/90">
                        {language === 'it' ? 'Centrocampisti' : 'Midfielders'}
                      </span>
                    </div>
                    <span className="text-sm font-serif font-bold text-white font-mono">
                      {midfieldersCount}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0dd08b]" style={{ width: `${midfieldersPercent}%` }} />
                  </div>
                </div>

                {/* Difensori */}
                <div className="flex flex-col gap-1 w-full pb-1 border-b border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></span>
                      <span className="font-sans uppercase tracking-[0.12em] font-medium text-white/90">
                        {language === 'it' ? 'Difensori' : 'Defenders'}
                      </span>
                    </div>
                    <span className="text-sm font-serif font-bold text-white font-mono">
                      {defendersCount}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3b82f6]" style={{ width: `${defendersPercent}%` }} />
                  </div>
                </div>

                {/* Portieri */}
                <div className="flex flex-col gap-1 w-full pb-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#d7ae6a] shrink-0 shadow-[0_0_6px_rgba(215,174,106,0.6)]"></span>
                      <span className="font-sans uppercase tracking-[0.12em] font-medium text-white/90">
                        {language === 'it' ? 'Portieri' : 'Goalkeepers'}
                      </span>
                    </div>
                    <span className="text-sm font-serif font-bold text-white font-mono">
                      {goalkeepersCount}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#d7ae6a]" style={{ width: `${goalkeepersPercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Immagine con sfumatura */}
              <div className="relative mt-2 w-full flex-grow flex items-end justify-center rounded-xl overflow-hidden min-h-[140px] border border-white/5 mix-blend-screen shadow-inner">
                {/* Sfumatura in alto per staccare dal testo */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/95 to-transparent z-10 pointer-events-none"></div>
                {/* Sfumatura in basso */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
                <img 
                  src="https://res.cloudinary.com/kwwyxgal/image/upload/v1783688380/Max_a_correcci_WHITEANGELX_gwnrze.png"
                  alt="Roster Illustration"
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-90 mix-blend-luminosity brightness-110 contrast-125"
                />
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-4 border-t border-white/5 mt-auto relative z-20">
              <button
                onClick={() => onTabChange && onTabChange('members')}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#d7ae6a]/60 text-[#eedab3] hover:text-[#d7ae6a] font-serif uppercase tracking-widest text-xs rounded-xl transition-all shadow-sm hover:shadow-[0_0_15px_rgba(215,174,106,0.2)] flex items-center justify-center gap-2 group/btn cursor-pointer"
              >
                <span>{language === 'it' ? 'TUTTI I MEMBRI' : 'ALL MEMBERS'}</span>
                <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* BOX G: Card Bacheca Trofei con Video Background          */}
        {/* ========================================================= */}
        <motion.div
          variants={itemVariants}
          id="box-trofei-club"
          className={`group border border-[#d7ae6a]/30 hover:border-[#d7ae6a]/70 rounded-2xl relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_10px_30px_rgba(0,0,0,0.9)] bg-[#0a0a0e] w-full cursor-pointer min-h-[250px] aspect-[1.5/1] md:min-h-0 ${
            isTrophyRoomExpanded 
              ? 'md:aspect-[16/9]' 
              : 'md:aspect-[3.2/1]'
          } md:hover:aspect-[16/9]`}
          onClick={() => setIsTrophyRoomExpanded(!isTrophyRoomExpanded)}
        >
          {/* Sfondo Video in Loop */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            poster="/uploads/logo.jpg"
            className="absolute inset-0 w-full h-full object-cover z-0"
          >
            <source src="https://res.cloudinary.com/kwwyxgal/video/upload/w_1920,c_limit,f_auto,q_auto:best/v1784215648/Photorealistic_locked-off_shot_with_the_subject_featuring_only_subtle_looping_micro-movements_yyrjgn.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay Scuro Radiale */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 pointer-events-none"></div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(215,174,106,0.12)_0%,rgba(10,10,14,0.80)_70%)] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 z-10"></div>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d7ae6a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-10"></div>
          
          {/* Silhouettes di Trofei ai lati */}
          <div className="absolute inset-0 flex justify-between items-center px-8 opacity-25 pointer-events-none transition-transform duration-700 group-hover:scale-105 z-10">
            <img src="https://res.cloudinary.com/kwwyxgal/image/upload/v1784273713/Progetto_senza_titolo_-_2026-07-17T093456.592_k9jg8l.png" alt="Trophy" className="w-24 h-24 mix-blend-screen opacity-50 object-contain" />
            <img src="https://res.cloudinary.com/kwwyxgal/image/upload/v1784273713/Progetto_senza_titolo_-_2026-07-17T093456.592_k9jg8l.png" alt="Trophy" className="w-24 h-24 mix-blend-screen opacity-50 object-contain" />
          </div>

          <div className="relative z-20 flex flex-col md:flex-row items-center justify-center md:justify-between h-full text-center md:text-left p-6 md:px-12 lg:px-20 gap-6">
            
            {/* Blocco Sinistro: Titolo */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center flex-col md:flex-row gap-3 md:gap-4 mb-2">
                <h2 className="text-2xl md:text-3xl font-serif font-black text-[#e4dbcd] uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight text-center md:text-left">
                  {language === 'it' ? (
                    <>BACHECA<br />TROFEI</>
                  ) : (
                    <>TROPHY<br />ROOM</>
                  )}
                </h2>
              </div>
              <div className="w-14 md:w-48 h-[1px] md:h-[2px] bg-gradient-to-r from-[#d7ae6a] md:via-[#d7ae6a] to-transparent md:to-transparent my-1 md:my-0 shadow-[0_0_8px_#d7ae6a]"></div>
            </div>

            {/* Blocco Destro: Sottotitolo e Badge */}
            <div className="flex flex-col items-center md:items-end">
              <span className="text-[10px] md:text-xs font-bold text-[#a89b8a] uppercase tracking-[0.25em] mb-2 text-center md:text-right drop-shadow-md">
                {language === 'it' ? 'ESPANSIONE CLUB IN CORSO' : 'CLUB EXPANSION IN PROGRESS'}
              </span>
              <div className="inline-block px-4 py-1 rounded-full border border-[#d7ae6a]/60 bg-[#d7ae6a]/10 backdrop-blur-md shadow-[0_0_15px_rgba(215,174,106,0.2)]">
                <span className="text-[10px] font-bold text-[#d7ae6a] uppercase tracking-widest">COMING SOON</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <PlayerCardModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        initialTab="kpi"
      />
    </div>
  );
}
